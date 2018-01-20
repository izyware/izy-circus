
var modtask = function() {}

// Returns in miliseconds
modtask.getNow = function() {
  var hrTime = process.hrtime()
  return Math.round(hrTime[0] * 1000 + hrTime[1] / 1000000);
}

modtask.render = function(renderUtils, params, cb) {
  var serverObjs = params.serverObjs;
  // put this after the jsdon require to make sure that there are no dependency issues
  if (params.testMode) {
    serverObjs.sendStatus({
      status: 200,
      plugin: 'circus'
    }, 'OK');
    if (cb) {
      cb({ success: true });
    }
    return ;
  }

  modtask.setupBrowserEnvironment(params);

  var startTime = modtask.getNow();
  window['__izy_frame_fullnotify'] = function(outcome) {
    if (!outcome.status) {
      outcome.status = outcome.success? 200: 500;
    }
    var pageHtml = renderUtils.serializedRenderedPage(params);
    var defaultHttpHeaders = { 'Content-Type': 'text/html' };
    outcome.httpHeaders = outcome.httpHeaders || {};
    var p;
    for(p in outcome.httpHeaders) {
      defaultHttpHeaders[p] = outcome.httpHeaders[p];
    }
    var endTime = modtask.getNow();
    var headerPrefix = 'X-IZYCIRCUS-RENDER-';
    defaultHttpHeaders[headerPrefix + 'TIME-MS'] = endTime - startTime;
    defaultHttpHeaders[headerPrefix + 'CACHE-MISSES'] = cacheMisses.join(',');
    serverObjs.res.writeHead(outcome.status, defaultHttpHeaders);
    serverObjs.res.write(pageHtml);
    serverObjs.res.end();
    if (cb) {
      cb({ success: true });
    }
    return ;
  }

  /* Cache for the IL */
  if (!global.__izyware__currentMemCache) {
    global.__izyware__currentMemCache = {};
  }

  var cacheMisses = [];
  modtask.ldmod('rel:bootstrapsystem').bootStrap({
    verbose: true, // lots of verbose info for cache access, etc.

    // These two get consumed by both the IL and BS layers
    cachingDisabled: false,
    releaseDisabled: false,

    // Use this if you need to:
    // 1. persist the cache into disk
    // 2. share the cache across things in a process (as shown below)
    currentMemCache: global.__izyware__currentMemCache,

    // Optional -- useful for performance optimization
    cacheEventLog: function(outcome) {
      if (outcome.status == 'miss') {
        cacheMisses.push(outcome.key);
      }
    },

    // Optional
    bootstrapUrl: params.bootstrapUrl,
    patchBoostrap: renderUtils.patchBoostrap
  }, function(outcome) {
    if (!outcome.success) {
      return serverObjs.sendStatus({
        status: 500,
        plugin: 'circus'
      }, 'Cannot bootstrap. Please try again later: ' + outcome.reason);
    }
  });
/*
  renderUtils.getBS(function(outcome) {
    if (!outcome.success) {
      return serverObjs.sendStatus({
        status: 500,
        plugin: 'circus'
      }, 'Cannot load bootstrap. Please try again later.');
    }
    var bootstrap = outcome.data;
    bootstrap = renderUtils.patchBoostrap(bootstrap);
    eval(bootstrap);
  });*/
}

modtask.setupBrowserEnvironment = function(params) {
  var jsdom = require('jsdom').jsdom;
  // Hmm, we need at least one element in the body for the bootstrap module
  // as runPkg currently scans for modtask.document.body.firstChild
  global.document = jsdom('<html><head></head><body><p></p><script>// empty script to allow document.getElementsByTagName(\'script\')[0] to work</script></body></html>', {
    // The URL that the app 'thinks' its on -- it will drive the nav module
    url: 'https://izyware.com/#' + params.uri
  });
  document['__izyware_appid'] = params.pkgName;
  global.window = document.defaultView;
  Object.keys(document.defaultView).forEach((property) => {
    if (typeof global[property] === 'undefined') {
      global[property] = document.defaultView[property];
    }
  });

  global.navigator = {
    userAgent: 'node.js'
  };

  window['frame_setnav_callback'] = function () {
  }
}