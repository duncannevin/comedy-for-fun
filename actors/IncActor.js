const P = require('bluebird')

class IncActor {
  constructor () {
    this.int = 0
  }

  async initialize (selfActor) {
    this.log = selfActor.getLog()

    return P.fromCallback(cb => {
      this.log.info(`IncActor initialized on pid: ${process.pid}`)
      cb()
    })
  }

  getNewNumber () {
    return ++this.int
  }
}

module.exports = IncActor
