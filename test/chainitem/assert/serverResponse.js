var modtask = function() {};
modtask.processChainItem = function(chainItem, cb) {
	var chainContext = chainItem.udt[2] || chainItem.sourcepart;
	var serverResponse = chainContext['serverResponse'];
	var testData = chainItem.udt[1];
	var p;
	var expectTo = function(p, verb, val1, val2) {
		if (!val1) val1 = testData[p];
		if (!val2) val2 = serverResponse[p];
		if (verb == 'EQUAL')
			return cb({reason: 'expected serverResponse.' + p + ' to ' + verb + ' ' + val1 + ' but got ' + val2 });
		if (verb == 'CONTAIN')
			return cb({reason: 'expected serverResponse.' + p + ' to ' + verb + ' ' + val1 + ' but it did not'});
	}
	if (testData.verbose) {
		console.log(serverResponse);
	}
	for(p in testData) {
		if (p == 'verbose') continue;
		switch(p) {
			case 'body':
				if (serverResponse.body.toString().indexOf(testData[p]) == -1) {
					return expectTo(p, 'CONTAIN')
				}
				break;
			case 'headers':
				var j;
				for(j in testData.headers) {
					if (serverResponse.headers[j].toString().indexOf(testData.headers[j]) == -1) {
						return expectTo('headers.' + j, 'CONTAIN', testData.headers[j], serverResponse.headers[j].toString());
					}
				}
				break;
			default:
				if (serverResponse[p] != testData[p]) {
					return expectTo(p, 'EQUAL');
				}
				break;
		}
	}
	cb({ success: true });
}
