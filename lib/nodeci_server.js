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

  self.status  = 'idle';
  self.settings = {
    port:             option_or_default(options.port,                              8126),
    hostname:         option_or_default(options.hostname,                          '0.0.0.0'),
    name:             option_or_default(options.name,                              "Nodeci"),
    build_command:    option_or_default(options.build && options.build.command,    'ls'),
    build_args:       option_or_default(options.build && options.build.args,       []),
    build_continuous: option_or_default(options.build && options.build.continuous, true),
    build_autostart:  option_or_default(options.build && options.build.autostart,  true),
    build_interval:   option_or_default(options.build && options.build.interval,   30)
  };

  self.init();

  if (self.settings.build_autostart) {
    self.startBuilder();
  }

  function option_or_default(value, default_v) {
    return (typeof(value) == 'undefined' ? default_v : value);
  }
};

NodeciServer.prototype.init = function() {
  var self = this;
  console.log("Nodeci starting...");
  self.initBuilder();
  self.initStaticServer();
  self.http_server   = self.createHTTPServer();
  self.bayeux_server = self.createBayeuxServer();
  self.bayeux_server.attach(self.http_server);
  self.http_server.listen(self.settings.port, self.settings.hostname);
};

NodeciServer.prototype.initBuilder = function() {
  var self = this;
  self.builder = new Builder(self.settings.build_command, self.settings.build_args);
  self.builder.on('success', function(build) {
    self.status = 'succeeded';
    self.publishStatus();
  });
  self.builder.on('failure', function(build) {
    self.status = 'failed';
    self.publishStatus();    
  });
  self.builder.on('start', function() {
    self.status = 'building';
    self.publishStatus();
  });
  self.builder.on('log', function(data, build) {
    self.bayeux_server.getClient().publish('/log', data.toString());
  });
  self.builder.on('end', function(build) {
    self.bayeux_server.getClient().publish('/build-end', build.toHash());
  });
};

NodeciServer.prototype.initStaticServer = function() {
  var self = this;
  self.static_server = new static.Server('./public', {
    cache: false
  });
};

NodeciServer.prototype.createHTTPServer = function() {
  var self = this;
  console.log("Server listening on "+self.settings.hostname+':'+self.settings.port);
  var server = http.createServer(function (req, res) {
    self.static_server = new static.Server('./public', {
      cache: false
    });
    var pathname = url.parse(req.url).pathname;
    if (pathname == '/build') {
      console.log("BUILD      : "+req.connection.remoteAddress+" "+req.url);
      res.writeHead(200, {'Content-Type': 'text/plain'});
      if (self.builder.isReady()) {
        self.startBuilder();
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
    } else if (pathname == '/builds') {
      console.log("BUILDS     : "+req.connection.remoteAddress+" "+req.url);
      res.writeHead(200, {'Content-Type': 'application/x-javascript'});
      var jsonString = JSON.stringify(self.getBuildHashes());
      res.end(jsonString);
    } else if (pathname == '/name') {
      console.log("NAME       : "+req.connection.remoteAddress+" "+req.url);
      res.writeHead(200, {'Content-Type': 'application/x-javascript'});
      var jsonString = JSON.stringify(self.settings.name);
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

NodeciServer.prototype.getBuildHashes = function() {
  var self = this;
  var builds = self.builder.getBuilds();
  var build_hashes = [];
  for (i in builds) {
    console.log('mmmm', builds[i]);
    build_hashes.push(builds[i].toHash());
  }
  return build_hashes;
};

NodeciServer.prototype.publishStatus = function() {
  var self = this;
  self.bayeux_server.getClient().publish('/status', self.status);
};

NodeciServer.prototype.startBuilder = function() {
  var self = this;
  self.builder.start(self.settings.build_continuous, self.settings.build_interval);
};

module.exports = NodeciServer;