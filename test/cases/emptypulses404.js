var modtask = {};
modtask.runTest = function(doChain) {
	doChain([
		['simulateRender', { appname: 'test/sampleapps/emptypulses', uri: '/', verbose: true }],
	  ['assert/serverResponse', { status: 404 }]
	]);
}
