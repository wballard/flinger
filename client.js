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

  var functionApply = Function.prototype.apply;
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
  var console = window.console || (window.console = {});
  var noop = function() {};
  ['error', 'log', 'warn'].forEach(function(name) {
    var method = name in console && functionApply.bind(console[name], console) || noop;

    (console[name] = function() {
      if (arguments.length) {
        method(arguments);
        enqueue(arguments, name);
      }
    }).on = true;
  });

  window.Error = function() {
    try {
      enbarf();
    } catch(e) {
      enqueue(arguments, 'exception', e.stack.split('\n').splice(1).join('\n'));
    }
  };
  console.exception = Error;
  console.exception.on = true;
})();
