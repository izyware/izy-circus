var modtask = {};
modtask.runTest = function(doChain) {
	doChain([
		['simulateRender', { uri: '/badurlthatdoesnotexist.withextension' }],
	  ['assert/serverResponse', { status: 404 }],
		['assert/serverResponse', { body: 'the requested path was not found' }]
	]);
}
