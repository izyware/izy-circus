var modtask = {};
modtask.runTest = function(doChain) {
	doChain([
		['simulateRender', { appname: 'test/sampleapps/sitemap', uri: '/sitemap.xml', verbose: true }],
	  ['assert/serverResponse', { status: 200 }],
		['assert/serverResponse', { body: 'xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"' }],
		['assert/serverResponse', {
			headers: {
				'Content-Type': 'application/xml; charset=UTF-8'
			}
		}]
	]);
}
