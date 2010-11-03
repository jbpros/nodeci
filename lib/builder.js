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
  self.builds         = [];
  self.prepareCommand = prepareCommand,
  self.prepareArgs    = prepareArgs,
  self.preparing      = false;
  self.prepareDelayed = false;
};

Builder.prototype.__proto__ = EventEmitter.prototype;

Builder.prototype.start = function(continuous, interval) {
  var self = this;
  if (self.isBusy()) {
    throw "Builder already working";
  }

  var start_build = function() {
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
      }
      if (continuous) {
        setTimeout(function() {
          self.emit('start');
          start_build();
        }, interval);
      }
    });
    build.on('log', function(data) {
      self.emit('log', data, build);
    });
  };
  self.emit('start');
  start_build();
};

Builder.prototype.prepare = function() {
  var self = this;
  if (self.isBusy()) {
    self.prepareDelayed = true;
  } else {
    self.prepareDelayed = false;
    self.preparing = true;
    console.log('*** Preparing ***');
    var prepare = new Build(self.prepareCommand, self.prepareArgs);
    prepare.on('log', function(data) {
      console.log(data.toString());
    });
    prepare.on('success', function() {
      console.log('*** Prepared successfully ***');
    });
    prepare.on('failure', function(code, signal) {
      console.log('*** Failed to prepare ('+code+') ***');
    });
    prepare.on('end', function(code, signal) {
      self.preparing = false;
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