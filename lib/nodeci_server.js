var http = require('http');
var spawn = require('child_process').spawn;

function NodeciServer(options) {
  if (! (this instanceof arguments.callee)) {
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
};

NodeciServer.prototype.init = function() {
  var self = this;
  console.log("Init finished.");
  console.log("Starting...");
  self.start();
};

NodeciServer.prototype.start = function() {
  var self = this;
  var http_server = http.createServer(function (req, res) {
    if (require('url').parse(req.url).pathname == '/') {
      console.log("We've been hit by "+req.connection.remoteAddress+" on "+req.url);

      res.writeHead(200, {'Content-Type': 'text/plain'});
      res.write("starting process...\n---\n");
      
      // command = spawn('/bin/bash', ['/Users/jbpros/Projects/valipat/bash_cukes']);
      command = spawn('date');  

      command.stdout.on('data', function (data) {
        res.write(data);
      });
      
      command.stderr.on('data', function (data) {
        res.write(data);
      });

      command.on('exit', function (code, signal) {
        res.end('---\nreturn code: ' + code + '\n');
      });
    }
  });
  http_server.listen(8124, "127.0.0.1");
};

module.exports = NodeciServer;