var EventEmitter = require('events').EventEmitter;
var spawn = require('child_process').spawn;

function Build(command, args) {
  if (!(this instanceof arguments.callee)) {
    return new arguments.callee(arguments);
  }
  var self = this;

  self.finishedAt  = undefined;
  self.code        = undefined;
  self.signal      = undefined;
  self.log         = '';
  self.command     = spawn(command, args);

  self.command.stdout.on('data', function (data) {
    self.log = self.log + data
    self.emit('log', data);
  });
  
  self.command.stderr.on('data', function (data) {
    self.log = self.log + data
    self.emit('log', data);
  });

  self.command.on('exit', function (code, signal) {
    self.finishedAt = new Date().getTime();
    self.code       = code;
    self.signal     = signal;
    if (code == 0) {
      self.emit('success');
    } else {
      self.emit('failure', code, signal);
    }
    self.emit('end', code, signal);
  });
};

Build.prototype.__proto__ = EventEmitter.prototype;

Build.prototype.isRunning = function() {
  var self = this;
  return typeof(self.finishedAt) == 'undefined';
};

Build.prototype.getLog = function() {
  var self = this;
  return self.log;
};

Build.prototype.kill = function() {
  var self = this;
  self.command.stdout.close();
  self.command.stderr.close();
  self.command.stdin.close();
  self.command.kill('SIGHUP');
};

Build.prototype.getCode = function() {
  var self = this;
  return self.code;
};

Build.prototype.getSignal = function() {
  var self = this;
  return self.signal;
};

Build.prototype.getFinishTime = function() {
  var self = this;
  return self.finishedAt;
};

Build.prototype.didSucceed = function() {
  var self = this;
  return self.code == 0;
};

module.exports = Build;