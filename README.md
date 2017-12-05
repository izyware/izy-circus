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

## NOTE
for more details, visit https://izyware.com
