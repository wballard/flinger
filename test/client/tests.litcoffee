These tests run in the *browser*, making sure we trap and send
content along to the server.


  should = chai.should()


  describe "Client Library", ->
    before (done) ->
      done()

    after (done) ->
      done()

    it "grabs console log", (done) ->
      console.log 'hi', 'log', 1, {}
      done()

    it "grabs console error", (done) ->
      console.log 'hi', 'error'
      done()

    it "grabs window.Error construction", (done) ->
      new Error('hi error')
      done()

