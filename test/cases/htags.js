var modtask = {};
modtask.runTest = function(doChain) {
	doChain([
		['simulateRender'],
	  ['assert/serverResponse', { status: 200 }],
		['assert/serverResponse', { body: '<h1>1_title_content</h1>' }],
		['assert/serverResponse', { body: '<h2>1_description_content</h2>' }],
		['assert/serverResponse', { body: '<div>2_title_content</div>' }],
		['assert/serverResponse', { body: '<div>2_description_content</div>' }],
		function(_push) {
		//	console.log(modtask.serverResponse.body);
			_push(['nop']);
		}
	]);
}
