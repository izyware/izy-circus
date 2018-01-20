
var modtask = function() {}

modtask.bootStrap = function(cfg, cb) {
  modtask.startBootstrap(modtask.getBootStrap(cfg));
}

modtask.startBootstrap = function(__izyware__bootstrap_system, cb) {
  __izyware__bootstrap_system.start(cb);
}

modtask.getBootStrap = function(__izyware__bootstrap_system_config) {
  var __izyware__bootstrap_system = (function (cfg) {
    var modtask = {};
    var verbose = false;
    try {
      verbose = cfg.verbose;
    } catch (e) {}

    modtask.Log = function (x) {
      if (verbose) {
        console.log(x);
      }
    }

    modtask.Log('__izyware__bootstrap_system : ' + cfg.verbose +
      ' cachingDisabled: ' + cfg.cachingDisabled +
      ' releaseDisabled: ' + cfg.releaseDisabled
    );
    var currentMemCache = cfg.currentMemCache;

    var cacheManagerPrefix = '__izyware__cacheManager';
    var cacheManager = {
      cachingDisabled: cfg.cachingDisabled,
      releaseDisabled: cfg.releaseDisabled,

      // You can optionally return { pkg, moduleToRun } to run in the bootstrapContext
      // Useful for installing extra modules, overwriting functionality, etc.
      __runInBootstrapContext: function () {
        var transportmodule = 'izyware/loader/extension/transportmodule/http';
        var __runInBootstrapContext = {};
        if (cfg.modstrs[transportmodule]) {
          var pkg = {
            store: {}
          };
          var modsToAdd = [transportmodule, 'izyware/extensions/api'];
          var i;
          for (i = 0; i < modsToAdd.length; ++i) {
            pkg.store[modsToAdd[i]] = cfg.modstrs[modsToAdd[i]];
          }

          __runInBootstrapContext.pkg = pkg;
          __runInBootstrapContext.moduleToRun = transportmodule;
        }
        return __runInBootstrapContext;
      },

      get: function (key, outcome) {
        var res = currentMemCache[cacheManagerPrefix + key];
        if (!res || cacheManager.cachingDisabled) {
          modtask.Log('cm_get "' + key + '" not in cache or caching Disabled.');
          if (cfg.cacheEventLog) {
            cfg.cacheEventLog({ key: key, status: 'miss' });
          }
          outcome.success = false;
        } else {
          try {
            outcome.data = JSON.parse(res);
            outcome.success = true;
          } catch (e) {
            outcome.reason = e.message;
          }
        }
        modtask.Log('cm_get ' + key + ' ' + (outcome.success ? '[CACHED]' : '[NOT CASHED]' ) + ' ' + (res + '').length);
      },

      remove: function (key) {
        delete currentMemCache[cacheManagerPrefix + key];
      },

      set: function (key, val) {
        modtask.Log('cm_set ' + key);
        if (key != '__mainloader') {
          modtask.Log('non __mainloader change, flush the cash for __mainloader because we do not have proper management for __mainloader');
          cacheManager.remove('__mainloader');
        }
        var strVal = JSON.stringify(val);
        currentMemCache[cacheManagerPrefix + key] = strVal;
      }
    };

    // Replace this with your placeform specfic loader routine ...
    var loadBS = function(cb) {
      var bootstrapUrl = cfg.bootstrapUrl || 'https://izyware.com/bootstrap1.php?' + (new Date().getTime() + "");
      modtask.Log('Loading bootstrap from ' + bootstrapUrl);
      var request = require('request');
      request(bootstrapUrl, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          var bootstrap = body;
          cb({success: true, data: bootstrap });
        } else {
          cb({success: false, reason: 'error loading bootstrap ' + error})
        }
      });
    }

    var start = function (cb) {
      var outcome = {};
      cacheManager.get('__mainloader', outcome);
      if (!outcome.success || !outcome.data || outcome.data.length < 1) {
        loadBS(function(outcome) {
          if (!outcome.success) {
            return cb( { reason: 'Error loading bootstrap: ' + outcome.reason } );
          }
          data = outcome.data + '';
          try {
            if (cfg.patchBoostrap) {
              data = cfg.patchBoostrap(data);
            }
            eval(data);
            cacheManager.set('__mainloader', data);
          } catch (e) {
            return cb( { reason: 'error running new data. not-caching __mainloader. Error was: ' + e.message } );
          }
        });
      } else {
        try {
          if (cfg.patchBoostrap) {
            data = cfg.patchBoostrap(data);
          }
          eval(outcome.data);
        } catch (e) {
          cache.loader = false;
          cacheManager.set('__mainloader', null);
          return cb( { reason: 'error running cached data. deleting cache for __mainloader. Error was: ' + e.message } );
        }
      }
    }
    return {start: start, cm: cacheManager};
  })(__izyware__bootstrap_system_config);
  var __izyware__cacheManager = __izyware__bootstrap_system.cm;
  return __izyware__bootstrap_system;
}