function someRandomString() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4();
}

AlertifyQueue = {};

AlertifyQueue._queue = [];
AlertifyQueue._queued = {};

AlertifyQueue.idInUse = function (id) {
    return AlertifyQueue._queued[id] !== undefined || AlertifyQueue.activeId == id;
};

AlertifyQueue.getUniqueId = function () {
    var gid = someRandomString();
    while (AlertifyQueue.idInUse(gid)) {
        gid = someRandomString();
    }
    return gid;
};

/* Add something to the queue */
AlertifyQueue.add = function (type, content, callback, aid) {
    // If passed id is already inuse, return false
    if (aid && AlertifyQueue.idInUse(aid)) { return false; }

    // Use argument or generate unique ID
    var gid = aid || AlertifyQueue.getUniqueId();

    // Save arguments to object and push to queue
    AlertifyQueue._queued[gid] = {type: type, callback: callback, content: content};
    AlertifyQueue._queue.push(gid);

    // If no queue active or if active should be replaced, show next in queue
    if (!AlertifyQueue.activeId) {
        AlertifyQueue.next();
    }
    return gid;
};

/* Helper for confirm */
AlertifyQueue.confirm = function (content, callback, uid) {
    return AlertifyQueue.add('confirm', content, callback, uid);
};

/* Helper for alert */
AlertifyQueue.alert = function (content, callback, uid) {
    return AlertifyQueue.add('alert', content, callback, uid);
};

/* Shows next alert in queue (closes any active alerts) */
AlertifyQueue.next = function () {
    var nextId = AlertifyQueue._queue.shift(), obj = AlertifyQueue._queued[nextId];

    // If there's a active alert, we want to show next, so close it
    if (AlertifyQueue.activeId) {
        alertify.close();
        AlertifyQueue.activeId = null;
    }

    // If nothing more in queue, return false
    if (!nextId) { return false; }

    // If the ID in the queue was not removed from the object map, it means
    // it was not closed. So show it
    if (obj) {
        AlertifyQueue.activeId = nextId;
        delete AlertifyQueue._queued[nextId];
        alertify[obj.type](obj.content, function (e) {
            obj.callback && obj.callback(e);
            AlertifyQueue.activeId = null;
            AlertifyQueue.next();
        });
    } else {
        // There might still be objects in the queue so move on...
        AlertifyQueue.next();
    }
};

/* Close an alert by its ID */
AlertifyQueue.close = function (id) {
    if (AlertifyQueue.activeId == id) {
        // If wanting to close the alert that's currently open, go to next in
        // queue and it will be taken care of by next()
        AlertifyQueue.next();
    } else {
        // Else, remove from queue
        delete AlertifyQueue._queued[id];
    }
}

