var modtask = {};

// serialize methods serialize to html, etc.
modtask.serialize = function(pulse, params) {
  // gets set by parent
  var serializeMod = modtask.serializeMod;
  var outcome = {};
  modtask.serializeMod.getMetaGatewayAddress(pulse, params, outcome);
  var alt = pulse.title || '';
  var str = '';
  str += modtask.serializeMod.serializeWarning(outcome, 'serializeImage');
  str += '<img alt="' + alt + '" src="' + outcome.data + '"></img>';
  return str;
}

// gateway methods take over the stream and control headers, etc.
modtask.gateway = function(push, params, viewModule) {
}


