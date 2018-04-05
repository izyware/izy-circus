
module.exports = {
  factory: (config) => {
    var modRoot = require('izymodtask').getRootModule();

    var render = modRoot.ldmod('render/index');
    var outcome = render.applyConfig(config);
    if (!outcome.success) return outcome;

    var name = 'circus';
    if (!config.testUrl) config.testUrl = '/izycircustest';
    var circus = outcome;
    return {
      name,
      success: true,
      render,
      canHandle: function(req, sessionObjs) {
        if (!config.acceptedPaths) config.acceptedPaths = [];
        // metagatewayUrl is always present 
        config.acceptedPaths.push(config.metagatewayUrl);

        sessionObjs = sessionObjs || {};
        sessionObjs.parsed = modtask.parseClientRequest(req, config);

        if (sessionObjs.parsed.path == config.testUrl) return true;
        var i;
        for(i=0; i < config.acceptedPaths.length; ++i) {
          var path = config.acceptedPaths[i];
          if (path == '/') {
            if (sessionObjs.parsed.path == '/') {
              return true;
            }
          } else if (sessionObjs.parsed.path.toLowerCase().indexOf(path) == 0) {
            return true;
          }
        }
        return false;
      },
      handle: function (req, res, serverObjs, sessionObjs) {
        var parsed = sessionObjs.parsed;
        var outcome;
        outcome = modtask.determineContext(parsed);
        if (!outcome.success) return modtask.writeOutcome(outcome, res);
        render({
          config: config,
          serverObjs,
          uri: parsed.path,
          domain: parsed.domain,
          appname: outcome.appname
        }, (outcome) => {});
      }
    }
  }
};



var modtask = function() {}

modtask.Log = console.log;

modtask.parseClientRequest = function(req, config) {
  config = config || {};
  var outcome = {};
  var domain = req.headers.host.split(':')[0];
  var path = req.url.split('?')[0].split('#')[0];
  if (path.indexOf('/') != 0) {
    path = '/' + path;
  }
  var url = `http://${domain}${path}`;
  config.aliases = config.aliases || [];
  config.aliases.forEach( alias => {
    url = url.replace(alias, '.izyware.com');
  });
  outcome.url = url;
  outcome.path = path;
  outcome.domain = domain;

  return outcome;
}


modtask.writeOutcome = function(outcome, res) {

  var info = {
    status: 200,
    msg: ''
  };

  if (outcome.success) {
    info.msg = outcome.data;
  } else {
    info.status = 500;
    info.msg = outcome.reason;
  }
  res.writeHead(info.status, { 'Content-Type': 'text/html' });
  res.write(info.msg);
  res.end();
}

// also see izyware/viewer/state -- some overlap
modtask.determineContext = function(info) {
  var onsite = false;
  var url = info.url;

  if (url.match(/^http[s]*:\/\/[a-zA-Z0-9.]*izyware\.com\//)) {
    onsite = true;
  }

  var tempappid = null;
  if (onsite) {
    try {
      tempappid = url.split('://')[1].split('izyware.com')[0] + '';
      if (tempappid.length < 1) {
        // when the url is http://izyware.com
        tempappid = 'izyware';
      } else {
        tempappid = tempappid.substr(0, tempappid.length - 1);
      }
    } catch (e) { }
  } else {
    tempappid = url.split('://')[1].split('/')[0];
    if (tempappid.match(/.izyware.com\/$/)) {
      tempappid = tempappid.substr(0, tempappid.length - String('.izyware.com').length);
    }
  }
  return {
    success: true,
    appname: tempappid
  }
}
