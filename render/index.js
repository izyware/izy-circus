
var modtask = function(params, cb) {
  var params = Object.assign({}, params);
  var domain = params.domain;
  var appname = params.appname;
  var serverObjs = params.serverObjs;
  var uri  = params.uri;
  if (appname.toLowerCase() == 'www') {
    var token = 'www.';
    var newLoc = 'https://' + domain.substr(token.length) + uri;
    modtask.Log('www redirect (301) to ' + newLoc);
    serverObjs.res.writeHead(301, { 'Location': newLoc });
    serverObjs.res.end();
    return ;
  }

  if (uri.indexOf('.') >= 0 && uri != '/sitemap.xml') {
    serverObjs.res.writeHead(404);
    serverObjs.res.write('the requested path was not found: ' + uri);
    serverObjs.res.end();
    return ;
  }

  if (params.config.testUrl == uri) {
    return params.serverObjs.sendStatus({
      status: 200,
      plugin: 'circus'
    }, 'OK');
  }
  return modtask.ldmod('rel:v3').render(modtask, params, cb);
};


modtask.applyConfig = function(config) {
  var cfg = Object.assign({}, config);

  var outcome = { success: true };
  modtask.cfg = cfg;
  var needtoExists = {
    'metagatewayUrl' : 'i.e. /metagateway',
    'shardID' : 'hex string of length 8'
  };
  var p;
  for(p in needtoExists) {
    if (!cfg[p]) {
      outcome.success = false;
      outcome.reason = 'Please specify the ' + p + ' ' + needtoExists[p];
      return outcome;
    }
  }
  return outcome;
}