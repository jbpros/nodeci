var EventEmitter = require('events').EventEmitter;
var spawn = require('child_process').spawn;

function Build(command, args) {
  if (!(this instanceof arguments.callee)) {
    return new arguments.callee(arguments);
  }
  var self = this;

  self.finished = false;
  self.log     = '';
  self.command = spawn(command, args);
  
  self.command.stdout.on('data', function (data) {
    self.log = self.log + data
    self.emit('log', data);
  });
  
  self.command.stderr.on('data', function (data) {
    self.log = self.log + data
    self.emit('log', data);
  });

  self.command.on('exit', function (code, signal) {
    self.finished = true;
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
  return !self.finished;
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

module.exports = Build;