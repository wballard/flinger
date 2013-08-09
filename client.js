/*
 * This is the flinger client library.
 */
;
(function () {
  window.flingerAdditionalClientData = function () {
    return "";
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
  var enqueue = function(logArguments, kind, extra) {
    sendBuffer.push({
      arguments: Array.prototype.slice.call(logArguments).map(function (x) {return x.toLocaleString()}),
      kind: kind,
      extra: extra,
      user: flingerAdditionalClientData()
    });
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
  //patch console log, saving the original
  var originalConsoleLog = console.log || function(){};
  console.log = function() {
    if (arguments.length) {
      originalConsoleLog.apply(window, arguments);
      enqueue(arguments, 'log');
    }
  };
  //patch console warn, saving the original
  var originalConsoleWarn = console.warn || function(){};
  console.warn = function() {
    if (arguments.length) {
      originalConsoleWarn.apply(window, arguments);
      enqueue(arguments, 'warn');
    }
  };
  //patch console error, same trick
  var originalConsoleError = console.error || function(){};
  console.error = function() {
    if (arguments.length) {
      originalConsoleError.apply(window, arguments);
      enqueue(arguments, 'error');
    }
  };
  //now, this is a different trick, monkey patch Error
  var originalError = Error;
  Error = function(message) {
    var exception = new originalError(message);
    enqueue(arguments, 'exception', exception.stack);
    return exception;
  }
})();
