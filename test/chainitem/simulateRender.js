var modtask = {};

modtask.processChainItem = function(chainItem, cb) {
	var i = 1;
	var simulateParams = chainItem.udt[i++] || {};
	var chainContext = chainItem.udt[i++] || chainItem.sourcepart;
	modtask.simulateRender(simulateParams, function(serverResponse) {
		chainContext['serverResponse'] = serverResponse;
		cb({ success: true });
	});
}

// Instead of success: true|false we will have status
modtask.simulateRender = function(simulateParams, cbServerOutcome) {
	var appname = simulateParams.appname || 'test/sampleapps/allpulseitems';
	modtask.ldmod('render/index')({
		config: modtask.getSampleConfig(simulateParams),
		serverObjs: modtask.getServerObjs(cbServerOutcome),
		appname: appname,
		uri: simulateParams.uri || '/',
		domain: appname.replace(/\//g, '.') + '.izywaretest.com'
	}, function (outcome) {
		console.log('what_do_i_do_with_this_outcome?');
	});
}

modtask.getServerObjs = function(cbServerOutcome) {
	var serverOutcome = {};
	return {
		modtask: {},
		req: {},
		res: {
			end: function() {
				return cbServerOutcome(serverOutcome);
			},
			write: function(data) {
				serverOutcome.body = data;
			},
			writeHead: function(status, headers) {
				serverOutcome.status = status;
				serverOutcome.headers = headers;
			}
		},
		proxy: {},
		sendStatus: function (p1, err) {
			cbServerOutcome({
				status: p1.status,
				reason: err
			});
		},
		/*	serverLog: [Function],
		 sendStatus: [Function],
		 getCORSHeaders: [Function: getCORSHeaders],
		 acceptAndHandleCORS: [Function] */
	};
}

modtask.getSampleConfig = function(simulateParams) {
	var ret = {
		verbose: simulateParams.verbose,
		testUrl: '/izycircustest',
		metagatewayUrl: '/metagateway',
		shardID: 'shard-id',
		bootstrapUrl: 'https://izyware.com/bootstrapUrl.js',
		aliases: ['.izywaretest.com'],
		acceptedPaths: ['/blog', '/'],
		reloadPerRequest: true,
		name: 'circus',
		missingEntryPointAlias: 'apps/web/the_name:viewer/top'
	};
	return ret;
}
