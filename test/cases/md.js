var modtask = {};
modtask.runTest = function(doChain) {
	doChain([
		['simulateRender'],
	  ['assert/serverResponse', { status: 200 }],
		['assert/serverResponse', { body: '<!-- izy markdown -->' }],
		['assert/serverResponse', { body: '<h3>line1</h3>\n<h4>line2</h4>\n<h5>line3</h5>' }],
		['assert/serverResponse', { body: '<a href="http://link1">link1</a>' }]
	]);
}
