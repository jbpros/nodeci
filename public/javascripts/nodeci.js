function NodeciClient() {
  if (!(this instanceof arguments.callee)) {
    return new arguments.callee(arguments);
  }
  var self = this;

  self.init = function() {
    self.setupBayeuxHandlers();
    self.initDisplays();
  };

  self.setupBayeuxHandlers = function() {
    var log_el = $('.log');
    self.client = new Faye.Client('http://'+window.location.hostname+':'+window.location.port+'/faye', {
      timeout: 120
    });
    self.client.subscribe('/status', function(status){
      self.displayStatus(status);
    });
  };

  self.initDisplays = function() {
    $.getJSON("/status", function(status) {
      self.displayStatus(status);
    });
    $.getJSON("/log", function(log) {
      var log_el = $('.log');
      log_el.text(log);
      self.client.subscribe('/log', function(data) {
        log_el.text(log_el.text() + data);
      });
    });    
  };

  self.requestNewBuild = function() {
    $.getJSON("/exec");
  };

  self.requestBuildKill = function() {
    $.getJSON("/kill");
  };

  self.displayStatus = function(status) {
    var status_el = $('.status');
    var log_el = $('.log');
    switch(status) {
      case 'succeeded':
      status_el.text("SUCCEEDED");
      break
    case 'failed':
      status_el.text("FAILED");
        break;
    case 'building':
      status_el.text("BUILDING");
      log_el.text('');
      break;
    default:
      status_el.text("IDLE");
    }
  }
  self.init();
};

var NodeciClient;

jQuery(function() {
  nodeciClient = new NodeciClient();
    
  $('.build').click(function() {
    nodeciClient.requestNewBuild();
  });

  $('.kill').click(function() {
    nodeciClient.requestBuildKill();
  });
});