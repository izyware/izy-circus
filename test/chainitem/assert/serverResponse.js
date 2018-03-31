var modtask = function() {};
modtask.processChainItem = function(chainItem, cb) {
	var chainContext = chainItem.udt[2] || chainItem.sourcepart;
	var serverResponse = chainContext['serverResponse'];
	var testData = chainItem.udt[1];
	var p;
	var expectTo = function(p, verb) {
		if (verb == 'EQUAL')
			return cb({reason: 'expected serverResponse.' + p + ' to ' + verb + ' ' + testData[p] + ' but got ' + serverResponse[p]});
		if (verb == 'CONTAIN')
			return cb({reason: 'expected serverResponse.' + p + ' to ' + verb + ' ' + testData[p] + ' but it did not'});
	}
	for(p in testData) {
		switch(p) {
			case 'body':
				if (serverResponse.body.toString().indexOf(testData[p]) == -1) {
					return expectTo(p, 'CONTAIN')
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
