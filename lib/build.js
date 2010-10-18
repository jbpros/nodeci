var EventEmitter = require('events').EventEmitter;
var spawn = require('child_process').spawn;

function Build() {
  if (!(this instanceof arguments.callee)) {
    return new arguments.callee(arguments);
  }
  var self = this;

  self.finished = false;

  var command = spawn('/bin/bash', ['-l', './bash_cukes']);
  //var command = spawn('du', ['-h', '/Users/jbpros']);  

  command.stdout.on('data', function (data) {
    self.emit('log', data);
  });
  
  command.stderr.on('data', function (data) {
    self.emit('log', data);
  });

  command.on('exit', function (code, signal) {
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

module.exports = Build;