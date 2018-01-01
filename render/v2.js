
var modtask = function() {}

modtask.render = function(cacheManager, params, cb) {

  var serverObjs = params.serverObjs;

  var jsdom = require('jsdom').jsdom;

  // put this after the jsdon require to make sure that there are no dependency issues
  if (params.testMode) {
    return serverObjs.sendStatus({
      status: 200,
      plugin: 'circus'
    }, 'OK');
  }
  // Hmm, we need at least one element in the body for the bootstrap module
  // as runPkg currently scans for modtask.document.body.firstChild
  global.document = jsdom('<html><head></head><body><p></p><script>// empty script to allow document.getElementsByTagName(\'script\')[0] to work</script></body></html>', {
    // The URL that the app 'thinks' its on -- it will drive the nav module
    url: 'https://izyware.com/#' + params.uri
  });
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

  window['__izy_frame_fullnotify'] = function(outcome) {
    if (!outcome.status) {
      outcome.status = outcome.success? 200: 500;
    }
    var pageHtml = cacheManager.serializedRenderedPage(params);
    serverObjs.res.writeHead(outcome.status, { 'Content-Type': 'text/html' });
    serverObjs.res.write(pageHtml);
    serverObjs.res.end();
  }

  document['__izyware_appid'] = params.pkgName;
  cacheManager.getBS(function(outcome) {
    if (!outcome.success) {
      return serverObjs.sendStatus({
        status: 500,
        plugin: 'circus'
      }, 'Cannot load bootstrap. Please try again later.');
    }
    var bootstrap = outcome.data;
    bootstrap = cacheManager.patchBoostrap(bootstrap);
    eval(bootstrap);
  });
}
