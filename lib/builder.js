var EventEmitter = require('events').EventEmitter;
var spawn = require('child_process').spawn;

function Builder() {
  if (!(this instanceof arguments.callee)) {
    return new arguments.callee(arguments);
  }
  var self = this;
  EventEmitter.call(self);
};

Builder.prototype.__proto__ = EventEmitter.prototype;

Builder.prototype.start = function() {
  var self = this;

  // command = spawn('/bin/bash', ['/Users/jbpros/Projects/valipat/bash_cukes']);
  command = spawn('date');  

  command.stdout.on('data', function (data) {
    self.emit('stdout', data);
  });
  
  command.stderr.on('data', function (data) {
    self.emit('stderr', data);
  });

  command.on('exit', function (code, signal) {
    if (code == 0) {
      self.emit('success');
    } else {
      self.emit('failure', code, signal);
    }
    self.emit('end', code, signal);
  });  
};

module.exports = Builder;