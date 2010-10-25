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
    self.client.subscribe('/build-end', function(build) {
      self.displayBuildRecord(build);
    });
  };

  self.initDisplays = function() {
    $.getJSON("/status", function(status) {
      self.displayStatus(status, true);
    });
    $.getJSON("/log", function(log) {
      var log_el = $('.log');
      log_el.text(log);
      self.client.subscribe('/log', function(data) {
        log_el.text(log_el.text() + data);
      });
    });
    $.getJSON('/name', function(name) {
      $('.name').text(name);      
    });
  };

  self.requestNewBuild = function() {
    $.getJSON("/exec");
  };

  self.requestBuildKill = function() {
    $.getJSON("/kill");
  };

  self.displayStatus = function(status, init) {
    if (typeof(init) == 'undefined') {
      init = false;
    }
    var status_el = $('.status');
    var control_panel_el = $('.control-panel');
    var log_el = $('.log');
    control_panel_el.
      removeClass('succeeded').
      removeClass('failed').
      removeClass('building').
      removeClass('idle');
    switch(status) {
      case 'succeeded':
      status_el.text("Succeeded");
      control_panel_el.addClass('succeeded');
      break
    case 'failed':
      status_el.text("Failed");
      control_panel_el.addClass('failed');
      break;
    case 'building':
      status_el.text("Building");
      control_panel_el.addClass('building');
      if (!init) {
        log_el.text('');
      }
      break;
    default:
      status_el.text("Idle");
      control_panel_el.addClass('idle').addClass('idle');
    }
  }

  self.displayBuildRecord = function(build) {
    var resultClass = build.succeeded ? 'succeeded' : 'failed';
    var finishedAt  = new Date();
    finishedAt.setTime(build.finishedAt);
    $('.builds').append($('<li class="'+resultClass+'">'+finishedAt+'</li>'));
  };
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

  $('body').keypress(function(event) {
    // 'B'
    if (event.keyCode == 98 || event.keyCode == 66) {
      nodeciClient.requestNewBuild();
    }
  });
});