# Why Care?

Web applications, and single page applications in particular, make it
hard to see errors that are happening in client side JavaScript.

# What It Does

Flinger flings logs from your browser clients back to your node servers
so you can see what your users are up to.

# What It Is

Flinger is node _middleware_ for [express](https://github.com/visionmedia/express) or [connect](https://github.com/senchalabs/connect) that does two things:

* For the client, serves a client library that monkey patches
    * `console.log`
    * `console.error`
    * `Error`
* For the server, provides a receiver that catches and logs client logs

# How To Use It

**Flinger uses jQuery for HTTP back to the server**. Make sure it is in
your page.

Here is the most basic installation possible:

`npm install flinger`

```javascript
var path = require('path');
var express = require('express');
var flinger = require('flinger');
var app = express()
    .use(express.cookieParser())
    .use(express.static(path.join(__dirname, 'client')))
    .use(flinger())
    .listen(9999);
```

Flinger serves its client library automatically as a convenience, so on
the client:

```html
<script type="text/javascript" src="/flinger.js"></script>
```

This redirects, by default:

* client `console.log(...)` to server `console.log(...)`
* client `console.error(...)` to server `console.error(...)`
* client `new Error(...)` to server `console.error(...)`

## Fancy Server Use

Flinger lets you hook to reformat or log as you see fit, flinger really
is:

`flinger(onConsoleLog, onConsoleWarn, onConsoleError, onException)`

Each of the `onXXX` functions is:

`function handler(logEvent){}`

Each `logEvent` is:

* `request`, flinger logs over HTTP, so you can get at cookies etc to
  identify users and make custom logs
* `arguments`, the javascript `arguments` captured on the client
  function

## Fancy Client Use
If you want to prefix the flinger log messages, say with your user
session or user identifier -- we already thought of that:

```javascript
window.flingerAdditionalClientData = function () {
  return "Your User ID Here!";
}
```

Want to format your messages:
```javascript
window.flingerFormatter = function(x){
	return "Your Format Here!";
}
```

You can do this anywhere you like client side. Yep, it's a global
function, but did we mention that we're monkey patching console.log to
make this work? Don't panic.


And you can switch things off, which will log locally but not
got to the server:

```javascript
console.log.on = false;
console.warn.on = true;
console.error.on = true;
console.exception.on = true;
```

## Server side log customizations


By default flinger will log out the error from the client. But what if
you want more information from the request, or prepend something to the
log output?

Flinger has that covered with augmentLog.

Usage to prepend a date for each log message, and append some request
header fields:


<pre><code>
var flinger_handler = flinger();
flinger_handler.augmentLog = function (logArguments,request) {
  var stamp = new Date();
  logArguments.unshift(stamp + " Client side error >> ");
  logArguments.push("UserAgent : "+ request.headers['user-agent']);
  logArguments.push("Referer : "+ request.headers['referer']);
};
// now register this handler with the middleware stack
app.use(flinger_handler);
</code></pre>

