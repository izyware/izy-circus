var modtask = {};

modtask.processChainItem = function(chainItem, cb) {
	modtask.simulateRender(function(serverResponse) {
		var chainContext = chainItem.udt[1] || chainItem.sourcepart;
		chainContext['serverResponse'] = serverResponse;
		cb({ success: true });
	});
}

// Instead of success: true|false we will have status
modtask.simulateRender = function(cbServerOutcome) {
	var serverOutcome = {};
	modtask.ldmod('render/v3').render({}, {
		serverObjs: {
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
		},
		config: {
			verbose: false,
			testUrl: '/izycircustest',
			metagatewayUrl: '/metagateway',
			shardID: '1F4421AB',
			bootstrapUrl: 'https://izyware.com/chrome_extension.js',
			aliases: ['.izywaretest.com'],
			acceptedPaths: ['/blog', '/'],
			reloadPerRequest: true,
			name: 'circus',
			missingEntryPointAlias: 'apps/web/missingentrypointalias:viewer/top'
		},
		entrypoint: 'sampletestapp1:viewer/top',
		uri: '/',
		domain: 'sampletestapp1.izywaretest.com'
	}, function (outcome) {
		console.log('what_do_i_do_with_this_outcome?');
	});
}

