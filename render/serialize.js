var modtask = function() {}
modtask.verbose = false;

modtask.seqs = {};
modtask.seqs.serializeNavItemsFor = function(viewModule) {
  if (modtask.verbose) modtask.Log('serializeNavItemsFor: ' + viewModule.mod.__myname);
  var navItems = viewModule.navItems || [];
  return [
    ['nop'],
    function(push) {
      var str = '<ul>';
      navItems.forEach(item => {
        // dont show patterned items
        if (item.pattern) return;
        str += '<li><a href="/' + item.path + '">' + item.path + '</a></li>';
      });
      str += '</ul>';
      modtask.bodyStr = str + modtask.bodyStr;
      push(['nop']);
    }
  ];
}

modtask.seqs.serializeMetaFor = function(viewModule) {
  if (modtask.verbose) modtask.Log('serializeMetaFor: ' + viewModule.mod.__myname);
  if (modtask.stopSerializingMeta) {
    return [['nop']];
  }
  var pulses = viewModule.pulses || {};
  return [
    ['nop'],
    function (push) {
      if (pulses.meta)
        push(['import_pulses', pulses.meta, modtask]);
      else
        push(['nop']);
    },
    function (push) {
      if (modtask.pulses && modtask.pulses.length > 0) {
        modtask.headerStr += modtask.serializeMetaPulses(modtask.pulses);
        modtask.stopSerializingMeta = true;
      }
      push(['nop']);
    }
    ];
}

modtask.seqs.serializeBodyFor = function(viewModule) {
  if (modtask.verbose) modtask.Log('serializeBodyFor: ' + viewModule.mod.__myname);
  if (modtask.stopSerializingBody) {
    return [['nop']];
  }

  var pulses = viewModule.pulses || {};
  modtask.pulses = [];
  return [
      ['nop'],
      function (push) {
        if (pulses.content) {
          if (modtask.verbose) modtask.Log('import content pulses: ' + viewModule.mod.__myname);
          push(['import_pulses', pulses.content, modtask]);
        }
        else
          push(['nop']);
      },
      function (push) {
        if (viewModule.mod.calcContentsLinks) {
          if (modtask.verbose) modtask.Log('calcContentsLinks: ' + viewModule.mod.__myname);
          viewModule.mod.calcContentsLinks(modtask.pulses, function(links) {
            modtask.pulseLinks = links;
            push(['nop']);
          });
        } else {
          push(['nop']);
        }
      },
    function (push) {
      if (viewModule.mod.calcViewLinks) {
        if (modtask.verbose) modtask.Log('calcViewLinks: ' + viewModule.mod.__myname);
        viewModule.mod.calcViewLinks(modtask.pulses, function(links) {
          modtask.viewLinks = links;
          push(['nop']);
        });
      } else {
        push(['nop']);
      }
    },
      function (push) {
        if (modtask.pulses) {
          modtask.bodyStr +=  modtask.serializeContentPulses({
            pulses: modtask.pulses,
            pulseLinks: modtask.pulseLinks,
            mod: viewModule.mod,
            viewLinks: modtask.viewLinks
          });
        }

        if (modtask.pulses.length == 0) {
          var msg = 'no pulses found. Make sure calcPulse is defined in ' + viewModule.mod.__myname + ' and returns a non-empty result set';
          if (modtask.verbose) modtask.Log(msg);
          modtask.logToHtml(msg);
          modtask.params.serializeOutcome.status = 404;
          modtask.params.serializeOutcome.reason = 'No pulses found';
        }
        push(['nop']);
      },
    function(push) {
      modtask.stopSerializingBody = true;
      push(['nop']);
    }
  ];
}

modtask.logToHtml = function(str) {
  modtask.bodyStr += '\r\n<!---------------------------------------\r\n';
  modtask.bodyStr += str;
  modtask.bodyStr += '\r\n----------------------------------------!>\r\n';
}

modtask.seqs.serializeViews = function(push) {
  if (modtask.allViewModules.length <= modtask.currentViewModuleIndex) {
    if (modtask.verbose) modtask.Log('done with serializeViews');
    return push(['nop']);
  }
  var viewModule = modtask.allViewModules[modtask.currentViewModuleIndex++];
  if (modtask.verbose) modtask.Log('serializeViews: ' + viewModule.mod.__myname);

  var pulses = viewModule.pulses || {};
  var strs = {
    body: '',
    header: ''
  };
  var i;
  push([
    ['nop'],
    modtask.seqs.serializeNavItemsFor(viewModule),
    modtask.seqs.serializeBodyFor(viewModule),
    modtask.seqs.serializeMetaFor(viewModule),
    modtask.seqs.serializeViews
  ]);
}

modtask.serializeLink = function(link, viewModule) {
  var str = '_serializeLink_'
  if (viewModule && viewModule.params) {
    var full_hRef = viewModule.params.fullPath + '/' + link.framePath;
    str = '<a href="' + full_hRef + '">' + link.name + '</a>';
  }
  return str;
}

modtask.serializeContentPulses = function(data) {
  if (modtask.verbose) modtask.Log('serializeContentPulses ' + data.mod.__myname);
  var pulses = data.pulses;
  var strs = '<ul>\r\n';
  var i = 0;

  if (data.viewLinks) {
    strs +='<ul>';
    data.viewLinks.forEach(link => {
      strs +=  '<li>' + modtask.serializeLink(link, data.mod) + '</li>';
    });
    strs += '</ul>';
  }

  var gens = {
    img: modtask.ldmod('rel:handlers/img').sp('serializeMod', modtask),
    md: modtask.ldmod('rel:handlers/md').sp('serializeMod', modtask),
  };
  strs += '\r\n<ul>';
  modtask.pulses.forEach(pulse => {
    strs += '\r\n<li>\r\n';
    if (i == 0) {
      strs += '<h1>' + pulse.title + '</h1>';
    } else {
      strs += '<div>' + pulse.title + '</div>';
    }
    strs += gens.img.serialize(pulse, modtask.params);

    if (i == 0) {
      strs += '<h2>' + pulse.description + '</h2>';
    } else {
      strs += '<div>' + pulse.description + '</div>';
    }

    strs += gens.md.serialize(pulse, modtask.params);

      if (data.pulseLinks && data.pulseLinks[i] && data.mod.params) {
        strs += modtask.serializeLink(data.pulseLinks[i], data.mod);
      }
      strs += '</li>\r\n';
      i++;
  });
  strs += '\r\n</ul>';
  return strs;
}

modtask.serializeWarning = function(outcome, context) {
  var str = '';
  if (!context) context = '';
  if (!outcome.success) {
    str += '\n\n<!------------ IzyCircus WARNING[' + context + ']: ' + outcome.reason + ' !------------>\n\n';
  }
  return str;
}

modtask.serializeMetaPulses = function(metaPulses) {
  if (metaPulses.length == 0) {
    return '';
  }

  var meta = {};
  meta = metaPulses[0];
  var outcome = {};
  var mds = modtask.setMetaData(meta, outcome);
  var str = '';
  str += modtask.serializeWarning(outcome, 'setMetaData');
  mds.forEach(md => {
    str += '\r\n';
    if (md.tag == 'title') {
      str += '<title>' + md.val + '</title>';
      return;
    }
    str += '<meta';
    var p;
    for(p in md) {
      str += ' ' + (p + '="' + md[p] + '"' );
    }
    str += '>';
  });
  return str;
}

modtask.seqs.genFinalHtml = function(push, params) {
  if (modtask.verbose) modtask.Log('genFinalHtml');
  var content = ` 
    <!DOCTYPE html>
    <html><head>`;

  content += modtask.headerStr;
  content += `
		<style type="text/css">body { margin: 0; padding: 0; } </style>
    </head>
	`;

  content += '<body><div id="__izyware_circus_initial_wrapper">' + modtask.bodyStr + '</div>';
  var addAutoStart = true;
  if (!params.config || !params.config.bootstrapUrl) {
    addAutoStart = false;
  }
  if (modtask.verbose) modtask.Log('addAutoStart: ' + addAutoStart);
  if (addAutoStart) {
    content += "<script>var element = document.getElementById('__izyware_circus_initial_wrapper');element.parentNode.removeChild(element);</script>";
    content += "<script>document['__izyware_appid'] = '"
      + params.entrypoint.split(':')[0] + "'; document['__izyware_phantom_uri'] = '"
      + params.uri
      + "'; if ((window.location.href + '').indexOf('#') == -1) window.location.href = (window.location.href + '').split('#')[0] + '#" + params.uri
      + "';</script>";
    content += '<script src="' + params.config.bootstrapUrl + '"></script>';
  } else {
    content += modtask.serializeWarning({ reason: 'config.bootstrapUrl was not specified. autostart will be disabled' }, 'bootstrapUrl');
  }

  content += '</body></html>';
  params.serializeOutcome.pageHtml = content;
  push(['nop']);
}

modtask.serializeToHtml = function(push, allViewModules, params) {

  modtask.allViewModules = allViewModules;
  params = params || {
      bootstrapUrl: '',
      entrypoint: 'appid:viewer/top',
      uri: ''
    };
  modtask.bodyStr = '';
  modtask.headerStr = '';
  modtask.currentViewModuleIndex = 0;
  modtask.stopSerializingBody = false;
  modtask.stopSerializingMeta = false;
  modtask.params = params;


  modtask.params.serializeOutcome = {};
  modtask.params.serializeOutcome.status = 200;
  push([
    ['nop'],
    modtask.seqs.serializeViews,
    function(push) {
      modtask.seqs.genFinalHtml(push, params);
    }
  ]);
}

modtask.metaGateway = function(push, params) {
  var prefix = modtask.getMetaUriPrefix(params);
  var id = params.uri.substr(prefix.length);
  if (id.indexOf('-') >= 0) {
    id = id.split('-');
    id = id[id.length-1] + '';
    id = id.replace(/"/g); // injection protection
    if (id.length > params.config.shardID.length) {
      id = id.substr(params.config.shardID.length);
    } else {
      id = null;
    }
  } else {
    id = null;
  }

  if (!id) {
    return push(['server_response', { status: 404 }]);
  }

  modtask.pulses = [];
  push([
    ['import_pulses', {
      fields: ['icon1'],
      conditions: ' id = "' + id + '" ',
      limit: ' limit 0, 1 '
    }, modtask],
    function(push) {
      if (modtask.pulses.length == 0) return push(['server_response', { status: 404 }]);
      var pulse = modtask.pulses[0];
      modtask.ldmod('rel:stream').decodeBase64Content(pulse.icon1, params.serverObjs);
    }
  ]);
}

modtask.getMetaUriPrefix = function(params) {
  return params.config.metagatewayUrl + '/';
}

modtask.getMetaGatewayAddress = function(pulse, params, outcome) {
  if (!outcome) outcome = { };
  outcome.success = true;
  outcome.data = 'https://' + params.domain + modtask.getMetaUriPrefix(params) + pulse.address + '-' + params.config.shardID + pulse.id;
  if (!pulse.address || !pulse.id) {
    outcome.success = false;
    outcome.reason = '!pulse.address || !pulse.id is missing. link will be affected';
  }
  return outcome.data;
}

modtask.setMetaData = function(obj, imgOutcome) {
  if (!imgOutcome) imgOutcome = { };
  modtask.getMetaGatewayAddress(obj, modtask.params, imgOutcome);
  var imgurl = imgOutcome.data;
  if (modtask.verbose) modtask.Log('setMetaData: ' + JSON.stringify(imgOutcome));

  var items = [{
    tag: 'title',
    val: obj.title
  }, {
    name: 'description',
    content: obj.description
  }, {
    property: 'og:description',
    content: obj.description
  }, {
    property: 'og:title',
    content: obj.title
  }, {
    name: 'twitter:description',
    content: obj.description
  }, {
    name: 'twitter:title',
    content: obj.title
  }, { // og:image:width, og:image:height
    property: 'og:image',
    content: imgurl
  }, {
    name: 'twitter:image',
    content: imgurl
  }, {
    property: 'og:url',
    // placeholder
    content: 'selfurl'
  }, {
    property: 'og:type',
    content: 'article'
  }, {
    name: 'twitter:domain',
    content: 'izyware.com'
  }, {
    name: 'twitter:card',
    content: 'summary_large_image'
  }];

  var commonMetaItems = [{
    name: 'generator',
    content: 'izy-circus'
  }, {
    charset: 'utf-8'
  }, {
    name: 'viewport',
    content: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0'
  }, {
    'http-equiv': 'Content-Type',
    content: 'text/html; charset=utf-8'
  }, {
    name: 'referrer',
    content: 'origin'
  }];

  return commonMetaItems.concat(items);
}
