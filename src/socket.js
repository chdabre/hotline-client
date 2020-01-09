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
  }

  _onConnect () {
    this._socket.emit('init', {
      id: 'orange'
    })
  }
}
