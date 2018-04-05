var modtask = {};

// serialize methods serialize to html, etc.
modtask.serialize = function() {

}

// gateway methods take over the stream and control headers, etc.
modtask.gateway = function(push, params, viewModule) {
  var pulses = viewModule.pulses || {};
  if (!pulses.sitemap) {
    push(['server_response', { payload: 'pulse query for sitemap not defined in ' + viewModule.mod.__myname, status: 404 }]);
  } else {
    push([
      ['import_pulses', pulses.sitemap, modtask],
      function (push) {
        if (modtask.pulses.length == 0) return push(['server_response', { payload: 'pulse query for sitemap returned no results -- defined in ' + viewModule.mod.__myname, status: 404 }]);
        var pulse = modtask.pulses[0];
        if (!pulse.description) return push(['server_response', { payload: 'sitemap pulse[0] has no descripton', status: 404 }]);
        push(['server_response', {
          httpHeaders: {
            'Content-Type': 'application/xml; charset=UTF-8'
          },
          payload: pulse.description,
          status: 200
        }]);
      }
    ]);
  }
}


