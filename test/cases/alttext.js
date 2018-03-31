var modtask = {};
modtask.runTest = function(doChain) {
	doChain([
		['simulateRender'],
	  ['assert/serverResponse', { status: 200 }],
		['assert/serverResponse', { body: 'img alt="1_title_content"' }]
	]);
}
