var http = require('http');
var spawn = require('child_process').spawn;

http.createServer(function (req, res) {
  console.log("request");

  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.write("starting process...");
  
  command = spawn('/bin/bash', ['/Users/jbpros/Projects/valipat/bash_cukes']);  

  command.stdout.on('data', function (data) {
    res.write(data);
  });
  
  command.stderr.on('data', function (data) {
    res.write(data);
  });

  command.on('exit', function (code, signal) {
    res.write('child process return ' + code) + "\n";
    res.end('done.\n');
  });
  
}).listen(8124, "127.0.0.1");
