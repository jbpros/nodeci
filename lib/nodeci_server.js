require.paths.unshift('./lib');
var http  = require('http');
var url   = require('url');
var Builder = require('builder');

function NodeciServer(options) {
  if (!(this instanceof arguments.callee)) {
    return new arguments.callee(arguments);
  }
  var self = this;
  
  // self.settings = {
  //   port: options.port,
  //   geoipServer: {
  //       hostname: options.geoipServer.hostname
  //     , port:     options.geoipServer.port || 80
  //   }
  // };

  self.init();
  self.start();
};

NodeciServer.prototype.init = function() {
  var self = this;
  self.builder = new Builder();
  console.log("Init finished.");
};

NodeciServer.prototype.start = function() {
  console.log("Starting...");
  var self = this;
  var http_server = http.createServer(function (req, res) {
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
      res.writeHead(404, {'Content-Type': 'text/plain'});
      res.end("404 - Not found.");
    }
  });
  http_server.listen(8124, "127.0.0.1");
};

module.exports = NodeciServer;