
var modtask = function() {}
modtask.verbose = false;

// Returns in miliseconds
modtask.getNow = function() {
  var hrTime = process.hrtime()
  return Math.round(hrTime[0] * 1000 + hrTime[1] / 1000000);
}


modtask.render = function(renderUtils, params, cb) {
  modtask.rootmod = require('izymodtask').getRootModule();
  if (params.config.verbose) {
    modtask.verbose = true;
  }
  modtask.params = params;
  var uri = params.uri;
  var startTime = modtask.getNow();

  modtask.serverObjs = params.serverObjs;
  var serverObjs = params.serverObjs;

  modtask.currentViewModule = '';
  modtask.allViewModules = [];
  modtask.setupChaining();
  modtask.doChain([
    ['nop'],
    modtask.seqs.loadEntryPoint(params),
    function(push) {
      if (uri.indexOf(params.config.metagatewayUrl) == 0) {
        return modtask.ldmod('rel:serialize').sp('modcontroller', modtask).sp('verbose', modtask.verbose).metaGateway(push, params);
      }
      return push(['nop']);
    },
    ['import_module', 'ui/w/shell/navmulti:multi'],
    /* setup frame processor */
    function(push) {
      try {
        modtask.uriProcessor = modtask.ldmod('rel:uriprocessor');
        modtask.uriProcessor.start(modtask['ui/w/shell/navmulti:multi'], 'http://izycircus/#' + params.uri);
        modtask.currentViewModule = modtask.entrypoint;
        push(['nop']);
      } catch(e) {
        return modtask.handleTransitionFailure(e);
      }
    },
    modtask.seqs.processNextViewModule,
    function(push) {
      modtask.ldmod('rel:serialize').sp('modcontroller', modtask).sp('verbose', modtask.verbose).serializeToHtml(push, modtask.allViewModules, params);
    },
    function(push) {
      var outcome = {
        status: params.serializeOutcome.status,
        httpHeaders: { 'Content-Type': 'text/html' },
        payload: params.serializeOutcome.pageHtml
      };
      var endTime = modtask.getNow();
      var headerPrefix = 'X-IZYCIRCUS-RENDER-';
      outcome.httpHeaders[headerPrefix + 'TIME-MS'] = endTime - startTime;
      if (cb) {
     //   cb({ success: true });
      }
      push(['server_response', outcome]);
    }
  ]);
}

modtask.currentViewModuleParams = {};
modtask.seqs = {};
modtask.seqs.loadEntryPoint = function(params) {
  params.entrypoint = `${params.appname}:viewer/top`;
  modtask.entrypoint = params.entrypoint;
  return function(push) {
    push([
      //  Need this as it this will offer import_pulses
      ['import_module', modtask.entrypoint, modtask, true],
      function (push) {
        // We asked not to fail so that we can manually handle this
        if (modtask[modtask.entrypoint]) return push(['nop']);
        if (params.config.missingEntryPointAlias) {
          params.entrypoint = params.config.missingEntryPointAlias;
          modtask.entrypoint = params.entrypoint;
          return push(['import_module', params.config.missingEntryPointAlias]);
        }
        return push(['server_response', {payload: 'module ' + modtask.entrypoint + ' not found', status: 404}]);
      }
    ]);
  }
}
modtask.seqs.processNextViewModule = function(push) {
  var modname = modtask.currentViewModule;
  if (modtask.verbose) modtask.Log('processNextViewModule ' + modname);
  var viewModule = {
    mod: null,
    // collection of pulse queries
    pulses: {},
    // collection of navItem
    navItems: []
  };
  var seqs = [
    ['import_module', modname],
    function(push) {
      var p;
      for(p in modtask.currentViewModuleParams) {
        modtask[modname][p] = modtask.currentViewModuleParams[p];
      }
      viewModule.mod = modtask[modname];
      push(['nop']);
    },
    function(push) {
      var mod = viewModule.mod;
      if (mod.calcValidateState) {
        mod.calcValidateState(function(outcome) {
          if (outcome.status == 200) return push(['nop']);
          return push(['server_response', outcome]);
        });
      } else {
        push(['nop']);
      }
    },
    function(push) {
      var mod = viewModule.mod;
      if (mod.calcPulses) {
        mod.calcPulses(function (pulses) {
          viewModule.pulses = pulses;
          return push(['nop']);
        });
      } else {
        push(['nop']);
      }
    },
    function(push) {
      if (modtask.handleSpecialCases(viewModule, push)) {
        // break here
        return;
      }
      var mod = viewModule.mod;
      if (mod.calcNav) {
        mod.calcNav(function(navItems) {
          viewModule.navItems = navItems;
          modtask.uriProcessor.addNewNav(navItems, function(navItem, currentViewModuleParams) {
            if (navItem && navItem.views && navItem.views.body) {
              modtask.currentViewModule = navItem.views.body;
              modtask.currentViewModuleParams = currentViewModuleParams;
              return modtask.seqs.processNextViewModule(push);
            }
            return push(['nop']);
          });
        });
      } else {
        push(['nop']);
      }
    },
    function(push) {
      modtask.allViewModules.push(viewModule);
      push(['nop']);
    }
  ];
  push(seqs);
}

modtask.handleSpecialCases = function(viewModule, push) {
  if (modtask.params.uri == '/sitemap.xml') {
    modtask.ldmod('rel:handlers/sitemap').sp('modcontroller', modtask).sp('verbose', modtask.verbose).gateway(push, modtask.params, viewModule);
    return true;
  }
  return false;
}

modtask.setupChaining = function() {
  modtask.moderr = modtask.ldmod('rel:err/bare');
  var ctrl = modtask.ldmod('rel:transition').sp('modcontroller', {
    doTransition: modtask.doTransition,
    moddyn: modtask.ldmod('rel:dyn'),
    moderr: modtask.moderr
  });
  modtask.doChain = function (_chain, callback) {
    var part = {};
    if (!callback) callback = function () {};
    ctrl.doChain(_chain,
      part,
      part["__modui"],
      callback,
      null // chain params
    );
  }
}

modtask.handleTransitionFailure = function(err) {
  modtask.serverObjs.sendStatus({
    status: 500,
    plugin: 'circus'
  }, err);
  return true;
}

modtask.doTransition = function (transition, callback) {
  var params = transition.udt[1];
  var resolveTransition = function(keyName, data) {
    var result = modtask;
    if (transition.udt[2]) result = transition.udt[2];
    result[keyName] = data;
    callback(transition);
    return true;
  }

  switch (transition.method) {
    case 'server_response':
      // No callback - this will terminate the thread
      var outcome = transition.udt[1];
      var serverObjs = modtask.serverObjs;
      serverObjs.res.writeHead(outcome.status, outcome.httpHeaders);
      if (outcome.payload) serverObjs.res.write(outcome.payload);
      serverObjs.res.end();
      return true;
    case 'nop':
      callback(transition);
      return true;
    case 'import_pulses':
      var query = transition.udt[1];
      if (modtask.verbose) modtask.Log('Import Pulse: ' + JSON.stringify(query));
      try {
        var mod = modtask[modtask.entrypoint];
        var key = query.name || 'pulses';
        mod.sp('useNullAC', true);
        mod.importPulses(query, function(outcome) {
          if (!outcome.success) return modtask.handleTransitionFailure('Cannot import_pulses: ' + outcome.reason);
          return resolveTransition(key, outcome.data);
        });
      } catch(e) {
        return modtask.handleTransitionFailure('Cannot import_pulses: ' + e.message);
      }
      return true;
    case 'import_module':
      var pathName = transition.udt[1];
      var failWhenldPathError = !transition.udt[3];
      if (modtask.verbose) modtask.Log('failWhenldPathError, import_module: ' + failWhenldPathError + ' ' + pathName);
      try {
        modtask.ldPath(pathName, function (outcome) {
          if (!outcome.success && failWhenldPathError) return modtask.handleTransitionFailure('Cannot import_module ' + pathName + ': ' + outcome.reason);
          return resolveTransition(pathName, outcome.data);
        });
      } catch(e) {
        return modtask.handleTransitionFailure('Cannot import_module ' + pathName + ': ' + e.message);
      }
      return true;
  }
  return false;
}


modtask.ldPath = function(path, cb) {
  return ldPath(path, cb);

  function ldPath(path, cb) {
    var parsed = parseInvokeString(path);
    return ldParsedPath(parsed, cb);
  }

  function ldParsedPath(parsed, cb) {
    loadPackageIfNotPresent({
      pkg: parsed.pkg,
      mod: parsed.mod
    }, function (outcome) {
      if (!outcome.success) return cb(outcome);
      var reason = 'Unknown';
      try {
        return cb({success: true, data: outcome.rootmod.ldmod(parsed.mod)});
      } catch (e) {
        reason = e.message;
      }
      return cb({reason});
    });
  }

  function loadPackageIfNotPresent(query, cb) {
    // Unlike the api-gateway, we will *share* the context across the session using the common rootmod
    var rootmod = modtask.rootmod;
    var outcome = {success: true, reason: [], rootmod};

    var pkg = query.pkg;
    var mod = query.mod;

    var details = {};
    rootmod.ldmod('kernel\\selectors').objectExist(mod, details, false);
    // If you want to see the search paths, etc. try
    // console.log(details);
    if (details.found) {
      return cb(outcome);
    }

    if (pkg === '') return cb(outcome);
    var pkgloader = rootmod.ldmod('pkgloader');

    pkgloader.getCloudMod(pkg).incrementalLoadPkg(
      // One of these per package :)
      function (pkgName, pkg, pkgString) {
        try {
          rootmod.commit = "true";
          rootmod.verbose = false;
          rootmod.ldmod('kernel/extstores/import').sp('verbose', rootmod.verbose).install(
            pkg,
            rootmod.ldmod('kernel/extstores/inline/import'),
            function (ops) {
              if (rootmod.verbose) {
                console.log(ops.length + " modules installed for = " + pkgName);
              }
            },
            function (outcome) {
              outcome.reason.push(outcome.reason);
              outcome.success = false;
            }
          );
        } catch (e) {
          return cb({reason: e.message});
        }
      }, function () {
        cb(outcome);
      },
      cb
    );
  }

  function parseInvokeString(path) {
    var pkg = '';
    if (path.indexOf(':') >= 0) {
      pkg = path.split(':');
    }
    ;
    var mod, params = '';
    if (pkg.length) {
      mod = pkg[0] + '/' + pkg[1];
      pkg = pkg[0];
      params = path.substr(mod.length + 1);
    } else {
      pkg = '';
      mod = path;
      params = '';
    }
    return {path, pkg, mod, params};
  }
}