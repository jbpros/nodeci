require.paths.unshift('./lib');
require.paths.unshift('./vendor');
var NodeciServer = require('nodeci_server');
var config       = require('./config/nodeci_config');

new NodeciServer(config);
