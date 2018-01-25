
var modtask = function(params, cb) {
  var params = Object.assign({}, params);
  if (params.testMode) {
    params.serverObjs.sendStatus({
      status: 200,
      plugin: 'circus'
    }, 'OK');
    if (cb) {
      cb({ success: true });
    }
    return ;
  }

  if (!params.renderingVersion) {
    params.renderingVersion = 3;
  }

  if (params.renderingVersion == 2) {
    return modtask.ldmod('rel:v2').render(modtask, params, cb);
  } else if (params.renderingVersion == 3) {
    return modtask.ldmod('rel:v3').render(modtask, params, cb);
  }
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