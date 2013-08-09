These tests run in the *browser*, making sure we trap and send
content along to the server.


  should = chai.should()


  describe "Client Library", ->
    before (done) ->
      done()

    after (done) ->
      done()

    it "grabs console log", (done) ->
      console.log 'hi', 'log', 1, {}, true
      done()

    it "grabs console warn", (done) ->
      console.warn 'hi', 'warn', 2, {}, false
      done()

    it "grabs console error", (done) ->
      console.error 'hi', 'error', 3, {}, false
      done()

    it "grabs window.Error construction", (done) ->
      new Error('hi exception')
      done()

    it "lets you switch off the log", (done) ->
      console.log.on = true
      #indeed, this should not make it to the server
      console.log 'no, never, noooooo'
      done()
