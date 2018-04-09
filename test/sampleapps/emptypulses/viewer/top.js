var modtask = function(push) {}
modtask.calcPulses = function(cb) {
  var tags = {
    browse_pulse: 7,
    // help tags
    thisapp: 2
  };
  var offset = 0;
  var limit = 3;
  return cb({
    // frame work will pass this to modtask.importPulses to populate meta entries
    'meta': {
      id: 'meta'
    },
    // frame work will pass this to modtask.importPulses to populate content entries
    'content': {
      id: 'content'
    }
  });
};

modtask.importPulses = function(query, cb) {
 cb({
    success: true,
    data: [
    ]
  });
}
