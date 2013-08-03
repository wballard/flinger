/*
 * This is the flinger server middleware.
 */

var path = require('path');
var fs = require('fs');

var client = fs.readFileSync(path.join(__dirname, 'client.js'));

module.exports = function(onConsoleLog, onConsoleError, onError) {

  onConsoleLog = onConsoleLog || function(logEvent) {
    if (logEvent.request.cookies && logEvent.request.cookies.flinger) {
      logEvent.arguments.unshift('CLIENT ' + logEvent.request.cookies.flinger + ':');
    } else {
      logEvent.arguments.unshift('CLIENT:');
    }
    console.log.apply(null, logEvent.arguments);
  };

  var dispatch = {
    'log': onConsoleLog
  };

  var process = function(request, flungLogs) {
    flungLogs.forEach(function(log) {
      dispatch[log.kind]({
        arguments: log.arguments,
        request: request
      });
    });
  }
  return function (request, response, next) {
    //intercept requests for the client library
    if (request.url === '/flinger.js') {
      response.writeHead(200, {
        'Set-Cookie': 'flinger=' + Date.now(),
        'Content-Type': 'text/javascript'
      });
      response.write(client);
      response.end();
    } else if (request.headers['content-type'] === 'application/flinger') {
      var buf = '';
      request.setEncoding('utf8');
      request.on('data', function(chunk){ buf += chunk });
      request.on('end', function(){
        var first = buf.trim()[0];
        if (0 == buf.length) {
          return next(utils.error(400, 'invalid json, empty body'));
        }
        try {
          var flungLogs = JSON.parse(buf);
          process(request, flungLogs);
        } catch (err){
          err.body = buf;
          err.status = 400;
          return next(err);
        }
        response.end();
      });
    } else {
      next();
    }
  }
}
