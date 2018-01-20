
var modtask = function(config) {
	var outcome = {};

	outcome = modtask.testDiskCaching();
	if (!outcome.success) return modtask.showFailMsg(outcome);

	outcome = modtask.testIzyProxyPlugin();
	if (!outcome.success) return modtask.showFailMsg(outcome);

	modtask.Log('*** All tests were successfull ***');
};

modtask.showFailMsg = function(outcome) {
	modtask.Log('====== Error =======');
	modtask.Log(outcome.reason);
	modtask.Log('====================');
}

modtask.verifyString = function(str1, str2) {
	var outcome = { success: true };
	if (str1 + '' != str2 + '') {
		outcome.success = false;
		outcome.reason = str1 + ' <> ' + str2;
	}
	return outcome;
}

modtask.testIzyProxyPlugin = function() {
	modtask.Log('testIzyProxyPlugin');

	var outcome = {};

	outcome = modtask.testClientInfoParser();
	if (!outcome.success) return outcome;

	outcome = modtask.testUrlParser();
	if (!outcome.success) return outcome;

	return outcome;
}

modtask.testUrlParser = function() {
	modtask.Log('testUrlParser');
	var mod = modtask.ldmod('rel:../index');
	var items = [
		['https://izyware.izyware.com/', 'izyware'],
		['https://izyware.com/', 'izyware'],
		['https://www.izyware.com/', 'www']
	];

	var i, outcome;
	for(i=0; i < items.length; ++i) {
		outcome = modtask.verifyString(JSON.stringify(mod.determineContext( { url: items[i][0] } ).appname), JSON.stringify(items[i][1]));
		if (!outcome.success) {
			return outcome;
		}
	}
	return { success: true };

}

modtask.testClientInfoParser = function() {
	modtask.Log('testClientInfoParser');
	var mod = modtask.ldmod('rel:../index');
	var items = [
		// https://izyware.izyware.com/#/legal (# will not get sent by the browser)
		[{ headers: { host: 'izyware.izyware.com' }, url: '/'}, { url: 'http://izyware.izyware.com/', path: '/', domain: 'izyware.izyware.com'}],
		// https://izyware.izyware.com:1234/#/legal (# will not get sent by the browser)
		[{ headers: { host: 'izyware.izyware.com:1234' }, url: '/'}, { url: 'http://izyware.izyware.com/', path: '/', domain: 'izyware.izyware.com'}]
	];

	var i, outcome;
	for(i=0; i < items.length; ++i) {
		outcome = modtask.verifyString(JSON.stringify(mod.parseClientRequest(items[i][0])), JSON.stringify(items[i][1]));
		if (!outcome.success) {
			return outcome;
		}
	}
	return { success: true };

}

modtask.testDiskCaching = function() {
	modtask.Log('Test Caching');
	var mod = modtask.ldmod('rel:../render/index');
	mod.cfg = {
		cache: {
			folder: '/test/folder'
		}
	};

	var items = [
		[{ domain: 'izyware.com', uri: '/catalog'}, '/test/folder/__izyware.com__%2Fcatalog.izycache'],
		[{ domain: 'izyware.com', uri: '/cAtaLog'}, '/test/folder/__izyware.com__%2Fcatalog.izycache']
	];

	var i, outcome;
	for(i=0; i < items.length; ++i) {
		outcome = modtask.verifyString(mod.cache.getFname(items[i][0]), items[i][1]);
		if (!outcome.success) {
			return outcome;
		}
	}
	return { success: true };
}

