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
  
  self.init();
};

NodeciServer.prototype.init = function() {
  var self = this;
  self.builder       = new Builder();
  self.static_server = new static.Server('./public', {
    cache: false
  });
  self.http_server   = self.createHTTPServer();
  // self.bayeux_server = new
  // self.bayeux_server.attach(self.static_server);
  self.http_server.listen(8124, "127.0.0.1");
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
      console.log("We've been hit by "+req.connection.remoteAddress+" on "+req.url);

      res.writeHead(200, {'Content-Type': 'text/plain'});
      res.write("starting process...\n---\n");
      
      self.builder.on('stdout', function(data) {
        res.write(data);
      });

      self.builder.on('stderr', function(data) {
        res.write(data);
      });

      self.builder.on('end', function(code, signal) {
        res.end('---\nreturn code: ' + code + '\n');
      });
      
      self.builder.start();
    }
    else {
      self.static_server.serve(req, res);
    }
  });
  return server;
};

NodeciServer.prototype.createBayeuxServer = function() {
  var self = this;
  
  var bayeux = new faye.NodeAdapter({
    mount: '/socket',
    timeout: 45
  });
  return bayeux;
};

module.exports = NodeciServer;