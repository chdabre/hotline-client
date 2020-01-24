import EventEmitter from 'events'
import io from 'socket.io-client'

export default class SocketManager extends EventEmitter {
  static get SOCKET_URL () { return process.env.SOCKET_URL || 'http://hotline.imakethings.ch' }

  constructor (context) {
    super()

    // PhoneContext
    this._context = context

    this._socket = io(SocketManager.SOCKET_URL)
    this._setupHandlers()
  }

  _setupHandlers () {
    this._socket.on('connect', () => this._onConnect())
    this._socket.on('notify', () => this._onNotify())
    this._socket.on('init', (msg) => this.emit('init', msg))

    this._socket.on('new_messages', (msg) => {
      if (this._resolveNewMessages) this._resolveNewMessages(msg)
    })
  }

  _onConnect () {
    this._socket.emit('init', {
      id: 'orange'
    })
  }

  _onNotify () {
    this._context.soundManager.playSound('./src/assets/ring.opus')
  }

  getNewMessages () {
    this._socket.emit('get_new_messages', {
      id: 'orange'
    })

    return new Promise((resolve, reject) => {
      if (!this._resolveNewMessages) {
        this._resolveNewMessages = resolve
        setTimeout(() => {
          this._resolveNewMessages = null
          reject(new Error('Timeout'))
        }, 1000)
      } else {
        reject(new Error('No concurrent requests are allowed.'))
      }
    })
  }

  sendReaction (id, message) {
    return new Promise((resolve, reject) => {
      this._socket.emit('send_reaction', { id: 'orange', message_id: id, message })
      resolve()
    })
  }
}
