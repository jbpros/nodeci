require.paths.unshift('./lib');
require.paths.unshift('./vendor');
var http    = require('http');
var url     = require('url');
var Builder = require('builder');
var static  = require('node-static/lib/node-static');
var faye    = require('faye/faye-node');

function NodeciServer(options) {
  if (!(this instanceof arguments.callee)) {
    return new arguments.callee(arguments);
  }
  var self = this;
  self.status = 'idle';
  self.init();
};

NodeciServer.prototype.init = function() {
  var self = this;
  self.initBuilder();
  self.initStaticServer();
  self.http_server   = self.createHTTPServer();
  self.bayeux_server = self.createBayeuxServer();
  self.bayeux_server.attach(self.http_server);
  self.http_server.listen(8124, "0.0.0.0");
};

NodeciServer.prototype.initBuilder = function() {
  var self = this;
  self.builder = new Builder();
  self.builder.on('success', function() {
    self.status = 'succeeded';
    self.publishStatus();
  });
  self.builder.on('failure', function(code, signal) {
    self.status = 'failed';
    self.publishStatus();    
  });
  self.builder.on('start', function() {
    self.status = 'building';
    self.publishStatus();
  });
  self.builder.on('log', function(data) {
    self.bayeux_server.getClient().publish('/log', data.toString());
  });
};

NodeciServer.prototype.initStaticServer = function() {
  var self = this;
  self.static_server = new static.Server('./public', {
    cache: false
  });
};

NodeciServer.prototype.createHTTPServer = function() {
  console.log("Starting...");
  var self = this;
  var server = http.createServer(function (req, res) {
    self.static_server = new static.Server('./public', {
      cache: false
    });
    var pathname = url.parse(req.url).pathname;
    if (pathname == '/exec') {
      console.log("BUILD      : "+req.connection.remoteAddress+" "+req.url);
      res.writeHead(200, {'Content-Type': 'text/plain'});
      if (self.builder.isReady()) {
        self.builder.start();      
        res.end("BUILDING");
      } else {
        res.end("ALREADY BUILDING");
      }
    } else if (pathname == '/status') {
      console.log("STATUS     : "+req.connection.remoteAddress+" "+req.url);
      res.writeHead(200, {'Content-Type': 'application/x-javascript'});
      var jsonString = JSON.stringify(self.status);
      res.end(jsonString);
    } else if (pathname == '/log') {
      console.log("LOG        : "+req.connection.remoteAddress+" "+req.url);
      res.writeHead(200, {'Content-Type': 'application/x-javascript'});
      var jsonString = JSON.stringify(self.getLog());
      res.end(jsonString);
    } else if (pathname == '/kill') {
      console.log("KILL       : "+req.connection.remoteAddress+" "+req.url);
      res.writeHead(200, {'Content-Type': 'application/x-javascript'});
      if (self.builder.isBusy()) {
        self.builder.killBuild();
        res.end("KILLING IN THE NAME OF");
      } else {
        res.end("NOTHING TO KILL");
      };      
    } else {
      console.log("   (static): "+req.connection.remoteAddress+" "+req.url);
      self.static_server.serve(req, res);
    }
  });
  return server;
};

NodeciServer.prototype.createBayeuxServer = function() {
  var self = this;
  
  var bayeux = new faye.NodeAdapter({
    mount: '/faye',
    timeout: 45
  });
  return bayeux;
};

NodeciServer.prototype.getLog = function() {
  var self = this;
  var last_build = self.builder.getLastBuild();
  if (typeof(last_build) != 'undefined') {
    return last_build.getLog();
  } else {
    return '';
  }  
};

NodeciServer.prototype.publishStatus = function() {
  var self = this;
  self.bayeux_server.getClient().publish('/status', self.status);
};

module.exports = NodeciServer;