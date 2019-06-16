const P = require('bluebird')

class TimerActor {
  constructor () {
    this.time = 0

    this._runTimer = this._runTimer.bind(this)

    this._runTimer()
  }

  async initialize (selfActor) {
    this.log = selfActor.getLog();
    this.selfActor = selfActor

    return P.fromCallback(cb => {
      this.log.info(`TimerActor initialized on pid: ${process.pid}`)
      cb()
    })
  }

  _runTimer () {
    this.time++
    setTimeout(this._runTimer, 1000)
  }

  getTime () {
    return this.time
  }
}

module.exports = TimerActor
