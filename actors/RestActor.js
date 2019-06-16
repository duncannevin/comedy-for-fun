const restify = require('restify')
const restifyErrors = require('restify-errors')
const P = require('bluebird')
const WebSocket = require('ws')
const { URLSearchParams, parse } = require('url')

/**
 * Prime numbers REST server actor.
 */
class RestServerActor {
  /**
   * Actor initialization hook.
   *
   * @param {Actor} selfActor Self actor instance.
   * @returns {Promise} Initialization promise.
   */
  async initialize(selfActor) {
    this.log = selfActor.getLog();
    this.userRegistry = await selfActor.createChild('/actors/UserRegistryActor', { mode: 'forked' })

    return this._initializeServer(selfActor);
  }

  /**
   * Initializes server.
   *
   * @returns {Promise} Initialization promise.
   * @private
   */
  _initializeServer(selfActor) {
    const server = restify.createServer({
      name: 'prime-finder'
    })
    // Set 10 minutes response timeout.
    server.server.setTimeout(60000 * 10);

    // handle rest endpoints
    this._initializeRest(server)

    // handle sockets 
    this._initializeSockets(server)

    return P.fromCallback(cb => {
      server.listen(8080, (...args) => {
        cb(...args)
        this.log.info(`RestActor initialized on pid: ${process.pid}`)
        this.log.info('%s Listenting on port: %s', server.name, server.url)
      })
    })
  }

  /**
   * Initialializes REST endpoints
   * @param {*} server 
   * @private
   */
  _initializeRest (server) {
    // register user
    server.post('/users/:name', (req, res, next) => {
      const name = req.params.name

      if (!name) return new restifyErrors.NotFoundError()

      this.userRegistry.sendAndReceive('registerUser', name)
        .then(userId => {
          this.log.info(`Added user: ${name} with id: ${userId}`)
          res.header('Content-Type', 'text/plain')
          res.header('Data-User-Id', userId)
          res.send(201, userId)
        })
        .catch(err => {
          this.log.error(`Failed to add user: ${name}!`, err)
          next(new restifyErrors.InternalError(err))
        })
    })

    // get a new number for user
    server.get('/inc/:userId', (req, res, next) => {
      const userId = req.params.userId

      if (!userId) return new restifyErrors.NotFoundError()

      this.userRegistry.sendAndReceive('getInc', userId)
        .then(number => {
          this.log.info(`Incremented number to: ${number}`)
          res.header('Content-Type', 'text/plain')
          res.send(200, number.toString())
        })
        .catch(err => {
          this.log.error(`Failed to increment number!`, err)
          next(new restifyErrors.InternalError(err))
        })
    })
  }

  /**
   * Initializes socket connections
   * @param {*} io 
   * @private
   */
  _initializeSockets (server) {
    const timer = new WebSocket.Server({ noServer: true })

    // Starts a time for registered users then sends a message with the time
    // every second. The client can disconnect the socket then come back and 
    // there timer will still be running.
    timer.on('connection', async (ws, req) => {
      const userId = (new URLSearchParams(parse(req.url).search)).get('userId')
      if (!userId) return ws.destroy()
      const timerInterval = setInterval(() => {
        this.userRegistry.sendAndReceive('getTime', userId)
          .then(time => {
            ws.send(time)
          })
          .catch(err => {
            ws.terminate()
          })
      }, 1000)

      ws.on('close', () => {
        console.log('socket closed')
        clearInterval(timerInterval)
      })
    })

    server.server.on('upgrade', (req, socket, head) => {
      const pathname = parse(req.url).pathname

      // Registered users can connect a ws 
      // /timer?userId=<userId>
      if (pathname === '/timer') {
        timer.handleUpgrade(req, socket, head, (ws) => {
          timer.emit('connection', ws, req)
        })
      } else {
        socket.destroy()
      }
    })
  } 
}

module.exports = RestServerActor
