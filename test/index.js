
var modtask = function(config) {
	var outcome = modtask.ldmod('render/chain').setupChaining(modtask.processChainItem, function() {
		modtask.Log('Finish running tests');
	}, modtask);
	if (!outcome) {
		return modtask.showErrorAndExit(outcome);
	}
	modtask.doChain = outcome.doChain;
	modtask.doChain([
		['test', 'cases/md', 'renders markdown'],
		['test', 'cases/sitemap', 'gets sitemap.xml'],
		['test', 'cases/404s', '404s'],
		['test', 'cases/img', 'show alt text and url for images'],
		['test', 'cases/htags', 'should put the title and description as h1, h2 and the rest as div'],
		['test', 'cases/headers', 'should insert the correct device and meta headers'],
		function(_do) {
			modtask.Log('************** All tests passed! ***************');
			_do(['nop']);
		}
	])
};

modtask.showErrorAndExit = function(outcome) {
	console.log('error: ' + outcome.reason);
}

modtask.processChainItem = function (chainItem, cb) {
	modtask.Log('processChainItem [' + chainItem.sourcepart.__myname + '] ' + chainItem.method);
	switch (chainItem.method) {
		case 'test':
			var modRelName =  chainItem.udt[1];
			var caseName = chainItem.udt[2] || modRelName;
			modtask.Log('testing: "' + caseName + '"');
			var testMod = modtask.ldmod('rel:' + modRelName);

			var processChainItem = function(chainItem, cb) {
				return modtask.processChainItem(chainItem, cb);
			}
			var chainDone = function() {
				cb(chainItem);
			}
			var outcome = modtask.ldmod('render/chain').setupChaining(processChainItem, chainDone, testMod);
			if (!outcome) {
				modtask.showErrorAndExit(outcome);
				return true;
			}
			testMod.runTest(outcome.doChain);
			return true;
		case 'nop':
			cb(chainItem);
			return true;
		default:
			modtask.ldmod('rel:chainitem/' + chainItem.method).processChainItem(chainItem, function(outcome) {
				if (!outcome.success) return modtask.showErrorAndExit(outcome);
				return cb(chainItem);
			});
			return true;
	}
	modtask.showErrorAndExit({ reason: 'Unknown chainItem.method: ' + chainItem.method });
}