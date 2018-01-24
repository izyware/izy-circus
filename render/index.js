
var modtask = function(params, cb) {
  var params = Object.assign({}, params);
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

  params.pkgName = params.entrypoint.split(':')[0];
  if (!params.renderingVersion) {
    params.renderingVersion = 2;
  }

  if (params.renderingVersion == 2) {
    return modtask.ldmod('rel:v2').render(modtask, params, cb);
  } else if (params.renderingVersion == 3) {
    return modtask.ldmod('rel:v3').render(modtask, params, cb);
  }

  if (params.logtoconsole) {
    process.on('beforeExit', function () {
      if (beforeExitCalled) {
        return;
      }
      beforeExitCalled = true;
      modtask.finalize(params);
    });
    modtask.renderToConsole(params);
  } else {
    modtask.inProcMode(params, cb);
  }
};

modtask.inProcMode = function(params, cb) {
  var cachedData = modtask.cache.get(params);
  if (cachedData) {
    var metrics = {};
    metrics['Using Cache'] = 'Yes';
    modtask.applyMetrics(metrics);
    return cb({
      success: true,
      data: modtask.generateOutput(cachedData, metrics)
    });
  } else {
    return modtask.runExternalProcess(params, cb);
  }
}

modtask.applyConfig = function(config) {
  var cfg = Object.assign({}, config);

  var outcome = { success: true };

  if (!config.cache || !config.cache.folder) {
    return {
      success: false,
      reason: 'please specifiy cache.folder property'
    };
  }

  modtask.cfg = cfg;

  if (!modtask.getFolderConfig(true)) {
    outcome.success = false;
    outcome.reason = 'Please create the cache folder: i.e. mkdir -p ' + modtask.getFolderConfig();
    return outcome;
  }

  if (!cfg.bootstrapUrl) {
    outcome.success = false;
    outcome.reason = 'Please specify the bootstrapUrl: i.e. https://izyware.com/chrome_extension.js';
    return outcome;
  }

  return outcome;
}

var beforeExitCalled = false;
var now = (new Date()).getTime();
var exitOutcome = {
  success: false,
  reason: 'not initialized'
};

modtask.metrics = {

}

// Having the bootstrap layer referece the node from the cache layer will make some of these unneccessary
modtask.patchBoostrap = function(bootstrap) {
  var tokens = {};
  tokens['platformHTTP : function(method, url, postdata, contenttype, auth, transportsuccessfn, transportfailfn) {'] =
    'platformHTTP : function(method, url, postdata, contenttype, auth, transportsuccessfn, transportfailfn) { return __globalCallXmlHttp(modtask, method, url, postdata, contenttype, auth, transportsuccessfn, transportfailfn);';
  tokens['startsafari(); })()'] = 'startsafari(); ' + codeToAppend  + ' })()';
  tokens['transportmodule : \'qry/transport/scrsrc\''] = 'transportmodule : \'qry\\\\\\\\transport\\\\\\\\http\'';
  var p;
  for(p in tokens) {
    bootstrap = bootstrap.replace(p, tokens[p]);
  }
  return bootstrap;
}

modtask.serializedRenderedPage = function(params) {

  // todo: extract this from DOM so that app can set it.
  var data = {
    description: params.uri,
    title: params.pkgName + ' | ' + params.uri,
    url: 'https://' + params.domain + params.uri
  }

  var content = ` 
    <!DOCTYPE html>
    <html><head>`;

	content += document.getElementsByTagName('head')[0].innerHTML;
	content += `
		<style type="text/css">body { margin: 0; padding: 0; } </style>
    </head>
	`;
	
 
  content += '<body>' + document.body.innerHTML;
  var tag = '<script src="' + modtask.cfg.bootstrapUrl + '"></script>';
  content += "<script>var element = document.getElementById('__izyrt000izyware_viewer_top');element.parentNode.removeChild(element);document['__izyware_appid'] = '" + params.pkgName + "'; document['__izyware_phantom_uri'] = '"
    + params.uri
    + "'; if ((window.location.href + '').indexOf('#') == -1) window.location.href = (window.location.href + '').split('#')[0] + '#" + params.uri + "';</script>" + tag;

  content += '</body></html>';
  return content;
}

modtask.getFolderConfig = function(test) {
  var path = modtask.cfg.cache.folder;
  if (test) {
    const fs = require('fs');
    return !!fs.existsSync(path);
  }
  return path;
}

modtask.cache = {
  getFname : function(resource) {
    return modtask.getFolderConfig() + '/__' + resource.domain + '__' + encodeURIComponent(resource.uri.toLocaleLowerCase()) + '.izycache';
  },

  get : function(resource) {
    const fs = require('fs');
    var fname = this.getFname(resource);
    console.log('cache get ', fname);
    var ret = false;
    if (fs.existsSync(fname)) {
      ret = fs.readFileSync(fname).toString();
    }
    return ret;
  },

  set : function(resource, data) {
    const fs = require('fs');
    var fname = this.getFname(resource);
    console.log('cache set ', fname);
    fs.writeFileSync(fname, data);
  }
}

modtask.renderToConsole = function(params) {
  modtask.metrics['Using Cache'] = 'Yes';
  modtask.metrics['renderToConsole'] = 'Yes';
  modtask.cachedData = modtask.cache.get(params);
  if (modtask.cachedData) {
    exitOutcome.success = true;
    return;
  }
  modtask.metrics['Using Cache'] = 'No';
  console.log('No cache, doing full render ...');
  var jsdom = require('jsdom').jsdom;
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

  document['__izyware_appid'] = params.pkgName;
  modtask.getBS(function(outcome) {
    if (!outcome.success) {
      exitOutcome.success = false;
      exitOutcome.reason = outcome.reason;
      return ;
    }
    var bootstrap = outcome.data;
    bootstrap = modtask.patchBoostrap(bootstrap);
    eval(bootstrap);
    exitOutcome.success = true;
  });
}

modtask.applyMetrics = function(metrics) {
  metrics['start time'] = now;
  metrics['processing time (miliseconds)'] = (new Date()).getTime() - now;
}

modtask.generateOutput = function(pageHtml, metrics) {
  metrics['Payload Size'] = pageHtml.length;
  var metadata = '\r\n<!-- page rendered by izy-circus (' +  JSON.stringify(metrics) + ') -->';
  return metadata + pageHtml + metadata;
}

modtask.finalize = function(params) {
  modtask.applyMetrics(modtask.metrics);
  if (exitOutcome.success) {
    if (modtask.cachedData) {
      exitOutcome.data = modtask.cachedData;
    } else {
      exitOutcome.data = modtask.serializedRenderedPage(params);
      modtask.cache.set(params, exitOutcome.data);
    }
    console.log(modtask.generateOutput(exitOutcome.data, modtask.metrics));
  } else {
    console.log('circus error: ' + exitOutcome.reason);
  }
}


modtask.getBS = function(cb) {
  var bootstrap = '';
  var useLocalBootstrap = true;
  var bsfile = '__izyware_bootstrap.js';

  if (useLocalBootstrap && modtask.bsCache) {
    modtask.Log('Loading bootstrap from cache');
    var bootstrap = modtask.bsCache;
    bootstrap = bootstrap.toString();
    cb({success : true, data : bootstrap });
  } else {
    modtask.Log('Loading bootstrap from ' + modtask.cfg.bootstrapUrl);
    var request = require('request');
    request(modtask.cfg.bootstrapUrl, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var bootstrap = body;
        if (useLocalBootstrap) {
          modtask.bsCache = bootstrap;
        }
        cb({success: true, data: bootstrap });
      } else {
        cb({success: false, reason: 'error loading bootstrap ' + error})
      }
    })
  }

}

var codeToAppend = `
var __totalParts = 0;
var __globalCallXmlHttp = function(_modtask, method, url, postdata, contenttype, auth, transportsuccessfn, transportfailfn) {
	// console.log('__globalCallXmlHttp', url); 
var ret = (function() {

var modtask = {};
modtask.callXmlHttpObject = function(_modtask, method, url, postdata, contenttype, auth, transportsuccessfn, transportfailfn) {
	var shouldfail = false;	
	var parts;
   var isAsync = false;

	try {
		 method = method.toUpperCase();

		 var modurl = require("url");

		 parts = modurl.parse(url, true);
		 
		 var options = {
		   host: parts.host,
		   path: parts.path,
		   method: method,
		   headers: {
			'Content-Type': contenttype 
		   }      
		 };


		var mod = (parts.protocol == "https:" ? "https" : "http");
		var xmlhttp = require(mod);
		 if(typeof(auth) == "string" && auth.length > 0) {
			options.headers["Authorization"] = auth;
		 }
		 else if (typeof(auth) == "object") {
			var p;
			for(p in auth)
			       options.headers[p] = auth[p]; 
		 } 
		 // options.headers["Connection"] = "close";  
		 if (method == "POST" || method == "PUT") {
		    options.headers["Content-length"] = postdata.length;
		 } 

		 var ret = '';  
		 
		 if (typeof(transportsuccessfn) == "function")
		    isAsync = true;
		 if(!isAsync) {
			 var msg = 'Only async http requests are supported for nodejs. Make sure that force_async_to_sync is not accidently enabled.';
			 if (transportfailfn) {
				 transportfailfn(msg);
				 return;
			 }
			 throw (msg);
		 }
			var req = xmlhttp.request(options,
		    function(response) {
			 var str = ''
			 response.on('data', function (chunk) {
			   str += chunk;
			 });

			 response.on('end', function () {
	//	console.log('successful http', str.length);
			    transportsuccessfn(str);
			 }); 
		    } 	
		 ); 

		 req.on('error', function(err) {
		       transportfailfn("http request error: " + err + ", host: " + parts.host); 
		 });
		 

		  if (method == "POST" || method == "PUT") {
		    req.write(postdata);  
		  }
		  else {
		  } 
		 req.end();                 
	}
	catch(e)
	{
		shouldfail = true;
		ret = "";
	   ret += "Error: " + modtask.exceptionToString(e) + ", host: " + parts.host; 
	}

   if (shouldfail) {
      if (isAsync) {
         transportfailfn(ret);
         return ;
      } else {
         _modtask.Fail(ret);
      }
   } else  {
      return ret;
   }
}
return modtask;})();


ret.callXmlHttpObject(_modtask, method, url, postdata, contenttype, auth, transportsuccessfn, transportfailfn);		 
}

try {
	console.log('starting ...');
	startchrome();
} catch(e) {
	console.log(e);
} 
`;


modtask.runExternalProcess = function(params, cb) {

  var paths = {
    node: process.execPath,
    // not reliable when using izymodtask. Look up in require.cache instead
    circusModule: `${__dirname}/..`
  };

  var p, token = '/node_modules/izy-circus';
  for(p in require.cache) {
    if (p.indexOf(token) >= 0) {
      paths.circusModule = p.split(token)[0] + token;
      break;
    }
  }

  const fs = require('fs');
  var cliPath = paths.circusModule + '/cli.js';
  if (!fs.existsSync(cliPath)) {
    return cb({ reason: 'could not find circus cli.js: ' + cliPath });
  }

  var cmd = `cd ${paths.circusModule};${paths.node} cli.js method render logtoconsole true entrypoint ${params.entrypoint} uri ${params.uri} domain ${params.domain} cache.folder ${modtask.cfg.cache.folder} bootstrapUrl ${modtask.cfg.bootstrapUrl}`;

  const exec = require('child_process').exec;
  console.log('Running ...', cmd);
  exec(cmd, {maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
    if (err) {
      var info = {
        code: err.code,
        message: err.Error + ''
      }
      return cb({
        reason: 'error doing exec for izy-circus. More information available in the info property.-------------\r\n' + err.toString(),
        info: err.toString()
      });
    }

    console.log(stdout);

    var info = {};
    var index = stdout.indexOf('<!-- page rendered by izy-circus');
    if (index >= 0) {
      info.msg = stdout.substr(index);
      return cb({
        success: true,
        data: info.msg
      });
    } else {
      info.msg = 'Cannot find izy-circus header';
      return cb({
        success: false,
        data: info.msg
      });
    }
  });
}
