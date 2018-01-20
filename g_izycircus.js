
var modtask = {};
modtask.init = function() {
  // We need to create a 'platform based shell that would automatically do this for windows'
  if (modtask.ldmod("kernel/plat").getOSName() == "windows") {
    modtask.ldmod('net/http').configAsync('sync');
  }
  modtask.groupidobject = { "transportmodule" : false } ;
}
modtask.cmdlineverbs = {};
modtask.help = {};
modtask.helpStr = `
Please specifiy arguments. 

Rendering
-----------
node cli.js method render bootstrapUrl https://izyware.com/chrome_extension.js entrypoint izyware:viewer/top uri /company domain izyware.com  renderingVersion 2 cache.folder /tmp/izy-circus/


Test
----
node cli.js method test
`;

modtask.help[modtask.helpStr] = true;
modtask.commit = false;
modtask.verbose = false;

function showError(outcome) {
  console.log('ERROR: ' + outcome.reason);
}



modtask.simulateServerEnvironment = function(config) {
  config.serverObjs = {};
  config.serverObjs.res = {};
  config.serverObjs.res.writeHead = function(status, headers) {
    console.log('---- Server Response Headers ----')
    console.log(status);
    console.log(headers);
  };
  config.serverObjs.res.write = function(pageHtml) {
    console.log('---- Server Response Body ----');
    console.log('pageHtml length', pageHtml.length);
  };
  config.serverObjs.res.end = function() {
    console.log('---- Server Response END ----');
  }
}

modtask.cmdlineverbs.method = function() {
  var config = modtask.ldmod('izymodtask/index').extractConfigFromCmdLine('method');
  var method = config.method;
  delete config.method;
  switch(method) {
    case 'test':
      modtask.ldmod('rel:' + method + '/index')(config);
      break;
    case 'render':
      var mod = modtask.ldmod('rel:' + method + '/index');
      var outcome = mod.applyConfig(config);
      if (!outcome.success) return showError(outcome);
      modtask.simulateServerEnvironment(config);
      mod(config, function(outcome) {
        if (!outcome.success) return showError(outcome);
        console.log('************** Render successful! \n ******************');
      });
      break;
    default:
      modtask.Log(modtask.helpStr);
      break;
  }
}
