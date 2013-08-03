Test connection and action over a streaming socket.

    path = require('path')
    should = require('chai').should()
    Browser = require('zombie')
    connect = require('connect')
    flinger = require('../server')

    describe "Client library shim", ->
        before (done) ->
            app = connect()
                .use(connect.cookieParser())
                .use(connect.static(path.join(__dirname, 'client')))
                .use(flinger())
                .listen(9999)
            done()
        after (done) ->
            done()
        it "serves a browser client self test page", (done) ->
            this.timeout(5000)
            browser = new Browser()
            browser.debug = true
            browser.runScripts = true
            browser.visit 'http://localhost:9999/index.html', ->
                browser.success.should.be.ok
                done()
            , (err) ->
                if err
                    console.log 'ERRRRR', err
