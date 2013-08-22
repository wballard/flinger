/*
 * This is the flinger client library.
 */
;
(function () {
  window.flingerAdditionalClientData = function () {
    return "";
  }

  window.flingerFormatter = function (x) {
    return x.toLocaleString();
  }

  //debounce used to throttle sending to the server
  var debounce = function(func, wait, immediate) {
    var result;
    var timeout = null;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) result = func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) result = func.apply(context, args);
      return result;
    };
  };
  //hold all the log messages
  var sendBuffer = [];
  //enqueue up for transmission
  var enqueue = function(logArguments, kind, stack) {
    if (!console[kind].on) return;
    message = {
      arguments: Array.prototype.slice.call(logArguments).map(function (x) { return flingerFormatter(x); }),
      kind: kind,
      stack: stack,
    };
    message.user = flingerAdditionalClientData(message);
    sendBuffer.push(message);
    send();
  }
  //send along to the server
  var send = debounce(function(){
    jQuery.ajax({
      type: "POST",
      url: "/",
      contentType: 'application/flinger',
      data: JSON.stringify(sendBuffer)
    });
    sendBuffer = [];
  }, 1000);
  //ancient browsers may lack a console
  window.console = window.console || {};
  //patch console log, saving the original
  var originalConsoleLog = console.log || function(){};
  console.log = function() {
    if (arguments.length) {
      originalConsoleLog.apply(console, arguments);
      enqueue(arguments, 'log');
    }
  };
  console.log.on = true;
  //patch console warn, saving the original
  var originalConsoleWarn = console.warn || function(){};
  console.warn = function() {
    if (arguments.length) {
      originalConsoleWarn.apply(console, arguments);
      enqueue(arguments, 'warn');
    }
  };
  console.warn.on = true;
  //patch console error, same trick
  var originalConsoleError = console.error || function(){};
  console.error = function() {
    if (arguments.length) {
      originalConsoleError.apply(console, arguments);
      enqueue(arguments, 'error');
    }
  };
  console.error.on = true;
  //now, this is a different trick, monkey patch Error
  var originalError = Error;
  Error = function() {
    try {
      enbarf();
    } catch(e) {
      enqueue(arguments, 'exception', e.stack.split('\n').splice(1).join('\n'));
    }
  };
  console.exception = Error;
  console.exception.on = true;
})();
