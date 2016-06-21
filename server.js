/*
 * This is the flinger server middleware.
 * Can send notifications to HC
 */

var path = require('path');
var uglify = require('uglify-js');
var request = require('request');
var client = uglify.minify(path.join(__dirname, 'client.js')).code;



module.exports= function(onConsoleLog,
                          onConsoleWarn,
                          onConsoleError,
                          onException) {


  var defaultHeaderString = function(logEvent) {
    prefix = '';
    if (logEvent.user)
      prefix = logEvent.user;
    else if (logEvent.request.cookies && logEvent.request.cookies.flinger)
      prefix = 'CLIENT: ' + logEvent.request.cookies.flinger;

    logEvent.arguments.unshift(logEvent.kind + ':');
    if (prefix.length) logEvent.arguments.unshift(prefix);

    // cycle through any custom augmentations
    // Allow clients to augment the flinger log output with anything they want
    if(handler.augmentLog) {
      handler.augmentLog(logEvent.arguments,logEvent.request);
    }

  }

  notifyHC = function(message){
    console.log(message);
    oauthToken = process.env.HCToken || null
    roomName = process.env.HCRoom || null
    if (!oauthToken && !roomName) {
      return
    }

    request({
    url: "https://api.hipchat.com/v2/room/" + roomName + "/notification?notify=1&auth_token=" + oauthToken + "&message_format=text",
    method: "POST",
    body: JSON.stringify(message)
    }, function (error, response, body){
      console.log("Posted to HC", roomName, response);
    });
  }


  onConsoleLog = onConsoleLog || function(logEvent) {
    defaultHeaderString(logEvent);
    console.log.apply(null, logEvent.arguments);
  };

  onConsoleWarn = onConsoleWarn || function(logEvent) {
    defaultHeaderString(logEvent);
    console.warn.apply(null, logEvent.arguments);
  };

  onConsoleError = onConsoleError || function(logEvent) {
    defaultHeaderString(logEvent);
    console.error.apply(null, logEvent.arguments);
    notifyHC(logEvent.arguments)
  };

  onException = onException || function(logEvent) {
    defaultHeaderString(logEvent);
    if (logEvent.stack) logEvent.arguments.push(logEvent.stack);
    console.error.apply(null, logEvent.arguments);
  };

  var dispatch = {
    'log': onConsoleLog,
    'warn': onConsoleWarn,
    'error': onConsoleError,
    'exception': onException
  };

  var processLog = function(request, flungLogs) {
    flungLogs.forEach(function(log) {
      log.request = request;
      dispatch[log.kind](log);
    });
  }

  handler = function (request, response, next) {
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
          processLog(request, flungLogs);
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
  return handler;
}
