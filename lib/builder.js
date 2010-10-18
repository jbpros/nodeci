var EventEmitter = require('events').EventEmitter;
var Build = require('build');

function Builder() {
  if (!(this instanceof arguments.callee)) {
    return new arguments.callee(arguments);
  }
  var self = this;
  EventEmitter.call(self);

  self.builds = [];
};

Builder.prototype.__proto__ = EventEmitter.prototype;

Builder.prototype.start = function() {
  var self = this;
    
  if (self.isBusy()) {
    throw "Builder already working";
  }

  self.emit('start');

  var build = new Build();

  self.builds.unshift(build);

  build.on('success', function() {
    self.emit('success');
  });
  build.on('failure', function(code, signal) {
    self.emit('failure', code, signal);
  });
  build.on('end', function(code, signal) {
    self.emit('end', code, signal);
  });
  build.on('log', function(data) {
    self.emit('log', data);
  });
};

Builder.prototype.isBusy = function() {
  var self = this;
  return (typeof(self.builds[0]) != 'undefined' && self.builds[0].isRunning());
};

Builder.prototype.isReady = function() {
  var self = this;
  return (!self.isBusy());
};

Builder.prototype.getBuilds = function() {
  var self = this;
  return self.builds;
};

module.exports = Builder;