# izy-circus
Universal rendering component for Izyware

## INSTALLATION

If you are using npm (the Node.js package manager) always ensure that your npm is up-to-date by running:

`npm update -g npm`  

Then use:

`npm install izy-circus`

## USING THE TOOL

Circus is a browser written in pure JavaScript/HTML (self-interpreter and meta-circular evaluator). It is useful for lightweight headless rendering and building sophisticated debuggers for application and A/B testing.

You can either use it from the commandline interface:

```

node cli.js 


```

Or you can use it inside your node app (i.e. izy-proxy uses circus to render server side components).

```

  var _circus = require('izy-circus');
  var outcome = _circus.factory(config);

```

### izy-proxy dev environment

you can simply configure the package to auto reload and do

```
rsync -av --progress ./* ../izy-proxy/node_modules/izy-circus --exclude node_modules
```

## Testing

```
node cli.js method test
```

### Assertion Library
You can use the *test/lib/assert* library for adding assertions to your tests.

### Writing Tests
Writing tests has been simplifying by using the `Izy Chains` technology:

```
modtask.doChain([
	['test', 'cases/alttext', 'show alt text for images'],
	['test', 'cases/htags', 'should put the title and description as h1, h2 and the rest as div'],
	['test', 'cases/headers', 'should insert the correct device and meta headers'],
	function(_do) {
		modtask.Log('************** All tests passed! ***************');
		_do(['nop']);
	}
])
```

Each test case gets implement inside `test/cases/...` and should implement runTest. The framework will contextualize the chain for the test module.


For example, `alttext.js`

```
var modtask = {};
modtask.runTest = function(doChain) {
	doChain([
	  ['simulateRender'],
	  ['assert/serverResponse', { status: 200 }],
	  ['assert/serverResponse', { body: 'img alt="1_title_content"' }]
	]);
}
```


## HTML Warning Comments
In addition to providing performance and diagnostics via HTTP headers, WARNINGS are also logged as html comments. For example:

```
<!------------ IzyCircus WARNING[setMetaData]: !pulse.address || !pulse.id is missing. link will be affected !------------>
```

Izy Cloud Watch will scan your pages for warnings like this and alert if there are any content generation issues.


## NOTE
for more details, visit https://izyware.com


# Known Issues
* retire test/lib/assert and use the izy-proxy assertion librariy instead

# Change Log
* refactored the loadPackageIfNotPresent inside izy-circus/render/v3.js to use the configurable pkgloader using izy-proxy 2.0;

