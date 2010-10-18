function NodeciClient() {
  if (!(this instanceof arguments.callee)) {
    return new arguments.callee(arguments);
  }
  var self = this;

  this.init = function() {
    self.setupBayeuxHandlers();
  };

  this.setupBayeuxHandlers = function() {
    self.client = new Faye.Client('http://localhost:8124/faye', {
      timeout: 120
    });
    self.client.subscribe('/status', function(message){
      var message = $('#message');
      message.text(message.text() + '!');
      console.log('MESSAGE', message);
    });
  };

  self.init();
};

var NodeciClient;

jQuery(function() {
  NodeciClient = new NodeciClient();
});