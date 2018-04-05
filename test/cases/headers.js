var modtask = {};
modtask.runTest = function(doChain) {
	doChain([
		['simulateRender'],
	  ['assert/serverResponse', { status: 200 }],
		['assert/serverResponse', { body: '<meta name="generator" content="izy-circus">' }],
		['assert/serverResponse', { body: '<meta charset="utf-8">' }],
		['assert/serverResponse', { body: '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0">' }],
		['assert/serverResponse', { body: '<meta http-equiv="Content-Type" content="text/html; charset=utf-8">' }],
		['assert/serverResponse', { body: '<meta name="referrer" content="origin">' }],
		['assert/serverResponse', { body: '<title>1_title_meta</title>' }],
		['assert/serverResponse', { body: '<meta name="description" content="1_description_meta">' }],
		['assert/serverResponse', { body: '<meta property="og:image" content="https://test.sampleapps.allpulseitems.izywaretest.com/metagateway/address-shard-id1">' }],
		function(_push) {
			_push(['nop']);
		}
	]);
}
