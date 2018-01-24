
var modtask = function() {}

// Returns in miliseconds
modtask.getNow = function() {
  var hrTime = process.hrtime()
  return Math.round(hrTime[0] * 1000 + hrTime[1] / 1000000);
}


modtask.render = function(renderUtils, params, cb) {

  var uri = params.uri;
  /*
   https://izyware.com => '/'
   https://izyware.com/ => '/'
   https://izyware.com/product => '/product'
   https://izyware.com/product/ => '/product/undefined?'
  */

  var startTime = modtask.getNow();
  var cacheMisses = [];

  modtask.serverObjs = params.serverObjs;
  var serverObjs = params.serverObjs;

  // This will offer import_pulse
  modtask.mainappPathName = 'izyware:viewer/top';
  // Start with this
  modtask.currentViewModule = modtask.mainappPathName;
  modtask.allViewModules = [];
  modtask.setupChaining();
  modtask.doChain([
    ['import_module', 'ui/w/shell/navmulti:multi'],
    /* setup frame processor */
    function(push) {
      try {
        modtask.frameProcessor = modtask.ldmod('rel:frames');
        modtask.frameProcessor.start(modtask['ui/w/shell/navmulti:multi'], 'http://izycircus/#' + params.uri);
        modtask.currentViewModule =
        push(['nop']);
      } catch(e) {
        return modtask.handleTransitionFailure(e);
      }
    },
    modtask.seqs.processNextViewModule,
    function(push) {
      modtask.ldmod('rel:serialize').sp('modcontroller', modtask).serializeToHtml(push, modtask.allViewModules, params);
    },
    function(push) {
      var pageHtml = params.pageHtml;
      var outcome = {
        status: 200
      };
      var defaultHttpHeaders = { 'Content-Type': 'text/html' };
      outcome.httpHeaders = outcome.httpHeaders || {};
      var p;
      for(p in outcome.httpHeaders) {
        defaultHttpHeaders[p] = outcome.httpHeaders[p];
      }
      var endTime = modtask.getNow();
      var headerPrefix = 'X-IZYCIRCUS-RENDER-';
      defaultHttpHeaders[headerPrefix + 'TIME-MS'] = endTime - startTime;
   //   defaultHttpHeaders[headerPrefix + 'CACHE-MISSES'] = cacheMisses.join(',');
      serverObjs.res.writeHead(outcome.status, defaultHttpHeaders);
      serverObjs.res.write(pageHtml);
      serverObjs.res.end();
      if (cb) {
     //   cb({ success: true });
      }
      push(['nop']);
    }
  ]);
}



modtask.test_calcPulses = function(cb) {
  var tags = {
    browse_pulse: 7,
    // help tags
    thisapp: 2
  };
  var offset = 0;
  var limit = 3;
  return cb({
    'meta': {
      tagsToAnd: [tags.thisapp, tags.browse_pulse],
      fields: ['title', 'description', 'address'],
      order: null,
      limit: null
    },
    'content': {
      tagsToAnd: [tags.thisapp],
      fields: ['title', 'description', 'icon1', 'postdate', 'address'],
      order: 'order by postdate desc',
      limit: 'limit ' + offset + ',' + limit
    }
  });
};


modtask.currentViewModuleParams = {};
modtask.seqs = {};
modtask.seqs.processNextViewModule = function(push) {
  var modname = modtask.currentViewModule;
  console.log('processNextViewModule', modname);
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
      var mod = viewModule.mod;
      if (mod.calcNav) {
        mod.calcNav(function(navItems) {
          viewModule.navItems = navItems;
          modtask.frameProcessor.addNewNav(navItems, function(navItem, currentViewModuleParams) {
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
    case 'nop':
      callback(transition);
      return true;
    case 'import_pulses':
      var query = transition.udt[1];
      try {
        var mod = modtask[modtask.mainappPathName];
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
      try {
        ldPath(pathName, function (outcome) {
          if (!outcome.success) return modtask.handleTransitionFailure('Cannot import_module ' + pathName + ': ' + outcome.reason);
          return resolveTransition(pathName, outcome.data);
        });
      } catch(e) {
        return modtask.handleTransitionFailure('Cannot import_module ' + pathName + ': ' + e.message);
      }
      return true;
  }
  return false;
}

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
      return cb({ success: true, data: outcome.rootmod.ldmod(parsed.mod) });
    } catch (e) {
      reason = e.message;
    }
    return cb( { reason });
  });
}

function loadPackageIfNotPresent(query, cb) {
  // For security reasons we virtualize each requests's load into its own root context
  // However, the file system caching (if present) will still allow sharing of context
  var rootmod = require('izymodtask').getRootModule();
  var outcome = { success:true, reason: [],  rootmod };

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
  var modtask = rootmod;

  pkgloader.getCloudMod(pkg).incrementalLoadPkg(
    // One of these per package :)
    function(pkgName, pkg, pkgString) {
      try {
        modtask.commit = "true";
        modtask.verbose = false;
        modtask.ldmod('kernel/extstores/import').sp('verbose', modtask.verbose).install(
          pkg,
          modtask.ldmod('kernel/extstores/inline/import'),
          function (ops) {
            if (modtask.verbose) {
              console.log(ops.length + " modules installed for = " + pkgName);
            }
          },
          function (outcome) {
            outcome.reason.push(outcome.reason);
            outcome.success = false;
          }
        );
      } catch(e) {
        return cb({ reason: e.message });
      }
    }, function() {
      cb(outcome);
    },
    cb
  );
}

function parseInvokeString(path) {
  var pkg = '';
  if (path.indexOf(':') >= 0) {
    pkg = path.split(':');
  };
  var mod, params = '';
  if (pkg.length) {
    mod = pkg[0] + '/' + pkg[1];
    pkg = pkg[0];
    params = path.substr(mod.length+1);
  } else {
    pkg = '';
    mod = path;
    params = '';
  }
  return { path, pkg, mod, params };
}