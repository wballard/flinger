Test connection and action over a streaming socket.

    path = require('path')
    should = require('chai').should()
    Browser = require('zombie')
    connect = require('connect')
    flinger = require('../server')

    describe "Client library shim", ->
        before (done) ->
            app = connect()
                .use(require('cookie-parser')())
                .use(require('serve-static')(path.join(__dirname, 'client')))
                .use(flinger())
                .listen(9999)
            done()
        after (done) ->
            done()
        it "serves a browser client self test page", (done) ->
            this.timeout(5000)
            Browser.visit 'http://localhost:9999/index.html',
              {debug: true, runScripts: true}, (err, browser) ->
                if err
                    console.log 'ERRRRR', err
                    return done(err)
                browser.success.should.be.ok
                done()
