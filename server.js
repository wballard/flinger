/*
 * This is the flinger server middleware.
 */

var path = require('path');
var fs = require('fs');

var client = fs.readFileSync(path.join(__dirname, 'client.js'));

module.exports = function(onConsoleLog,
                          onConsoleWarn,
                          onConsoleError,
                          onException) {

  var defaultHeaderString = function(logEvent) {
    prexif = '';
    if (logEvent.user) {
      prefix = logEvent.user;
    } else if (logEvent.request.cookies && logEvent.request.cookies.flinger) {
      prefix = 'CLIENT ' + logEvent.request.cookies.flinger;
    } else {
      prefix = 'CLIENT';
    }
    return prefix + ' ' + logEvent.kind + ':';
  }

  onConsoleLog = onConsoleLog || function(logEvent) {
    logEvent.arguments.unshift(defaultHeaderString(logEvent));
    console.log.apply(null, logEvent.arguments);
  };

  onConsoleWarn = onConsoleWarn || function(logEvent) {
    logEvent.arguments.unshift(defaultHeaderString(logEvent));
    console.warn.apply(null, logEvent.arguments);
  };

  onConsoleError = onConsoleError || function(logEvent) {
    logEvent.arguments.unshift(defaultHeaderString(logEvent));
    console.error.apply(null, logEvent.arguments);
  };

  onException = onException || function(logEvent) {
    logEvent.arguments.unshift(defaultHeaderString(logEvent));
    logEvent.arguments.push('\n');
    if (logEvent.stack) logEvent.arguments.push(logEvent.stack);
    console.error.apply(null, logEvent.arguments);
  };

  var dispatch = {
    'log': onConsoleLog,
    'warn': onConsoleWarn,
    'error': onConsoleError,
    'exception': onException
  };

  var process = function(request, flungLogs) {
    flungLogs.forEach(function(log) {
      log.request = request;
      dispatch[log.kind](log);
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
