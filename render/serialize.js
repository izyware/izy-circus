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
          modtask.outcome.status = 404;
          modtask.outcome.reason = 'No pulses found';
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

  strs += '\r\n<ul>'
  modtask.pulses.forEach(pulse => {
    strs += '\r\n<li>';
    strs += '\r\n<h1>' + pulse.title + '</h1>' +
      '<img src="' + modtask.getMetaGatewayAddress(pulse, modtask.params) + '"></img>' +
      '<h2>' + pulse.description + '</h2>' +
      (pulse.markdown1? '<div>' +  pulse.markdown1 + '</div>' : '');
      if (data.pulseLinks && data.pulseLinks[i] && data.mod.params) {
        strs += modtask.serializeLink(data.pulseLinks[i], data.mod);
      }
      strs += '</li>\r\n';
      i++;
  });
  strs += '\r\n</ul>';
  return strs;
}

modtask.serializeMetaPulses = function(metaPulses) {
  if (metaPulses.length == 0) {
    return '';
  }

  var meta = {};
  meta = metaPulses[0];
  var mds = modtask.setMetaData(meta);
  var str = '';
  mds.forEach(md => {
    str += '\r\n';
    if (md.tag == 'title') {
      str += '<title>' + md.val + '</title>';
      return;
    }
    str += '<meta ';
    var p;
    for(p in md) {
      str += (p + '="' + md[p] + '"' );
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
    content += '<!-- WARNING: config.bootstrapUrl was not specified. autostart will be disabled !--->';
  }

  content += '</body></html>';
  params.pageHtml = content;
  push(['nop']);
}

modtask.serializeToHtml = function(push, allViewModules, params) {

  modtask.allViewModules = allViewModules;
  params = params || {
      bootstrapUrl: '',
      entrypoint: 'appid:viewer/top',
      uri: ''
    };

  modtask.outcome = {};
  modtask.outcome.status = 200;
  modtask.bodyStr = '';
  modtask.headerStr = '';
  modtask.currentViewModuleIndex = 0;
  modtask.stopSerializingBody = false;
  modtask.stopSerializingMeta = false;
  modtask.params = params;

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

modtask.getMetaGatewayAddress = function(obj, params) {
  return 'https://' + params.domain + modtask.getMetaUriPrefix(params) + obj.address + '-' + params.config.shardID + obj.id;
}

modtask.setMetaData = function(obj) {
  var imgurl = modtask.getMetaGatewayAddress(obj, modtask.params);
  if (modtask.verbose) modtask.Log('setMetaData: ' + imgurl);

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
  return items;
}
