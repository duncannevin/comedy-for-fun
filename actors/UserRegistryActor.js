const uuid = require('uuid/v4')
const P = require('bluebird')

class UserRegistryActor {
  constructor () {
    this.selfActor = null
    this.users = {}
  }

  async initialize (selfActor) {
    this.log = selfActor.getLog();
    this.selfActor = selfActor

    return P.fromCallback(cb => {
      this.log.info(`UserRegistryActor initialized on pid: ${process.pid}`)
      cb()
    })
  }

  async registerUser (name) {
    const incSevice = await this.selfActor.createChild('/actors/IncActor')
    const id = uuid(8)
    this.users[id] = {
      name,
      incSevice
    }
    return id
  }

  async getInc (userId) {
    const user = this.users[userId]
    if (user) {
      return user.incSevice.sendAndReceive('getNewNumber')
    } else {
      return P.reject(new Error(`${userId} not found`))
    }
  }

  async getTime (userId) {
    const user = this.users[userId]
    if (user) {
      if (user.timer) {
        return user.timer.sendAndReceive('getTime')
      } else {
        user.timer = await this.selfActor.createChild('/actors/TimerActor')
        return user.timer.sendAndReceive('getTime')
      }
    } else {
      return P.reject(new Error(`${userId} not found`))
    }
  }
}

module.exports = UserRegistryActor
