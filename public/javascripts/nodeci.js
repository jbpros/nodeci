function NodeciClient() {
  if (!(this instanceof arguments.callee)) {
    return new arguments.callee(arguments);
  }
  var self = this;

  this.init = function() {
    self.setupBayeuxHandlers();
  };

  this.setupBayeuxHandlers = function() {
    var status = $('.status');
    var log = $('.log');
    self.client = new Faye.Client('http://localhost:8124/faye', {
      timeout: 120
    });
    self.client.subscribe('/status', function(data){
      if (data['finished'] && data['succeeded']) {
        status.text("SUCCEEDED");
      } else if (data['finished']) {
        status.text("FAILED");
      } else {
        status.text("BUILDING");
        log.text('');
      }
    });
    self.client.subscribe('/log', function(data) {
      log.text(log.text() + data);
    });
  };

  self.init();
};

var NodeciClient;

jQuery(function() {
  NodeciClient = new NodeciClient();
});