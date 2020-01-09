import EventEmitter from 'events'
import io from 'socket.io-client'

export default class SocketManager extends EventEmitter {
  static get SOCKET_URL () { return 'http://10.0.1.165:3000' }

  constructor () {
    super()

    this._socket = io(SocketManager.SOCKET_URL)
    this._setupHandlers()
  }

  _setupHandlers () {
    this._socket.on('connect', () => this._onConnect())
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

  getNewMessages () {
    this._socket.emit('get_new_messages', {
      id: 'orange'
    })

    return new Promise((resolve, reject) => {
      if (!this._resolveNewMessages) {
        this._resolveNewMessages = resolve
        setTimeout(() => reject(new Error('Timeout')), 1000)
      } else {
        reject(new Error('No concurrent requests are allowed.'))
      }
    })
  }
}
