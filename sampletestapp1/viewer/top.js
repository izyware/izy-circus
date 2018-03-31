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
      { id: 1, address: 'address', title: '1_title_' + query.id, description: '1_description_' + query.id },
      { id: 2, address: 'address', title: '2_title_' + query.id, description: '2_description_' + query.id }
    ]
  });
}
