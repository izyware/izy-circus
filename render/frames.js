
var modtask = {};

modtask.currentFrameIndex = 0;
modtask.start = function(multi, currentUrl) {
  modtask.multi = multi;
  modtask.multi.reset();
  modtask.multi.currentUrl = currentUrl; // 'http://multitest/#/invalidpath/with/other/stuff';
}

// we own the mockFrame so nothing gets rendered without our permission
modtask.addNewNav = function(navConfig, targetHitCB) {
  var getName = function(index) {
    return 'frame' + (index > 0 ? 'frame'+ index : false);
  }
  var parentName = getName(modtask.currentFrameIndex++);
  var name = getName(modtask.currentFrameIndex);
  modtask.mockFrame(name, parentName, navConfig, function(item) {

    var part = modtask.testFrames[name].part;
    var frame = modtask.multi.findFrameFor(part.itemid);
    var ctrl = frame.ctrl;
    targetHitCB(item, {
      __matches: ctrl.state.matches,
      params: modtask.multi.calculateFrameParams(frame)
    });
  });
  modtask.performTransition(name, 'frame_register');
  modtask.performTransition(name, 'frame_setnav', 'nav');
}

modtask.testFrames = {};
modtask.mockFrame = function(name, parentName, nav, targetHitCB) {
  var itemid = name;
  if (modtask.testFrames[parentName]) {
    itemid = modtask.testFrames[parentName].part.itemid + '_' + itemid;
    modtask.testFrames[parentName].nav[1].childName = name;
  }

  if (!nav) {
    nav = [
      { path : name + '1',  views : { 'body' : 'path/to/body1'   } },
      { path : name + '2',  views : { 'body' : 'path/to/body2'   } }
    ];
  };

  modtask.testFrames[name] = {
    nav: nav,
    part: modtask.mockPart(itemid, targetHitCB)
  }
}

modtask.mockPart = function(itemid, targetHitCB) {
  var part = {
    itemid: itemid,
    __myname: itemid,
    seqs: {
      onnavigate: function() {
        return part.seqs.onsetnav();
      },

      onsetnav: function() {
        // placeholder

        var item = part.modnav.getItem();

        if (targetHitCB) {
          return targetHitCB(item);
        }
        console.log('Landed on item: ', item);
      }
    },
    modcontroller: { doChain: function(a, chn) {
      // always assume we are doing onsetnav
      part.seqs.onsetnav();
    } }
  };
  return part;
};

modtask.performTransition = function(testName, method, p1) {
  modtask.multi.doTransition({
    sourcepart: modtask.testFrames[testName].part,
    method: method,
    udt: [method, modtask.testFrames[testName][p1]]
  }, function() {} );
}
