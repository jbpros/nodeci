var EventEmitter = require('events').EventEmitter;
var Build = require('build');

function Builder(command, args, prepareCommand, prepareArgs, options) {
  if (!(this instanceof arguments.callee)) {
    return new arguments.callee(arguments);
  }
  var self = this;
  EventEmitter.call(self);
  self.command        = command;
  self.args           = args;
  self.continuous     = false;
  self.interval       = 0;
  self.builds         = [];
  self.prepareCommand = prepareCommand,
  self.prepareArgs    = prepareArgs,
  self.preparing      = false;
  self.prepareDelayed = false;
  self.timeoutID      = null;
};

Builder.prototype.__proto__ = EventEmitter.prototype;

Builder.prototype.start = function(continuous, interval) {
  var self = this;
  if (self.isBusy()) {
    throw "Builder already working";
  }
  self.continuous = continuous;
  self.interval   = interval;
  self.build();
};

Builder.prototype.build = function() {
  var self = this;
  var start_build = function() {
    clearTimeout(self.timeoutID);
    var build = new Build(self.command, self.args);
    self.builds.unshift(build);
    build.on('success', function() {
      self.emit('success', build);
    });
    build.on('failure', function(code, signal) {
      self.emit('failure', build);
    });
    build.on('end', function(code, signal) {
      self.emit('end', build);
      if (self.prepareDelayed) {
        self.prepare();
      } else if (self.continuous) {
        self.timeoutID = setTimeout(function() {
          if (self.isReady()) {
            self.emit('start');
            start_build();
          }
        }, self.interval);
      }
    });
    build.on('log', function(data) {
      self.emit('log', data, build);
    });
  };
  self.emit('start');
  start_build();
}

Builder.prototype.prepare = function() {
  var self = this;
  if (self.isBusy()) {
    self.prepareDelayed = true;
  } else {
    console.log('*** Preparing ***');
    self.prepareDelayed = false;
    self.preparing = true;
    self.emit('prepare-start');
    var prepare = new Build(self.prepareCommand, self.prepareArgs);
    prepare.on('log', function(data) {
      console.log(data.toString());
    });
    prepare.on('success', function() {
      console.log('*** Prepared successfully ***');
      self.emit('prepare-success');
    });
    prepare.on('failure', function(code, signal) {
      console.log('*** Failed to prepare ('+code+') ***');
      self.emit('prepare-failure');
    });
    prepare.on('end', function(code, signal) {
      self.preparing = false;
      if (self.prepareDelayed) {
        self.prepare();
      } else if (self.continuous) {
        self.build();
      }
    });
  }
};

Builder.prototype.isBuilding = function() {
  var self = this;
  return (typeof(self.builds[0]) != 'undefined' && self.builds[0].isRunning());  
};

Builder.prototype.isPreparing = function() {
  var self = this;
  return (self.preparing);
};

Builder.prototype.isBusy = function() {
  var self = this;
  return (self.isBuilding() || self.isPreparing());
};

Builder.prototype.isReady = function() {
  var self = this;
  return (!self.isBusy());
};

Builder.prototype.getBuilds = function() {
  var self = this;
  var builds = self.builds.slice(0);
  if (self.isBusy()) {
    builds.shift();
  }
  return builds;
};

Builder.prototype.getLastBuild = function() {
  var self = this;
  return self.builds[0];
};

Builder.prototype.killBuild = function() {
  var self = this;
  self.getLastBuild().kill();
};

module.exports = Builder;