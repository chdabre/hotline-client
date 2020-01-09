import io from 'socket.io-client'

export default class SocketManager {
  static get SOCKET_URL () { return 'http://10.0.1.165:3000' }

  constructor () {
    this._socket = io(SocketManager.SOCKET_URL)
    this._setupHandlers()
  }

  _setupHandlers () {
    this._socket.on('connect', () => this._onConnect())
  }

  _onConnect () {
    this._socket.emit('init', {
      id: 'orange'
    })
  }
}
