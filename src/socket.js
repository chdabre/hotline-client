import EventEmitter from 'events'
import io from 'socket.io-client'
import config from '../config.js'

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
    this._socket.on('disconnect', () => this.emit('disconnect'))
    this._socket.on('notify', () => this.emit('notify'))
    this._socket.on('init', (msg) => this.emit('init', msg))
    this._socket.on('messages', (msg) => this.emit('messages', msg))
  }

  _onConnect () {
    this._socket.emit('init', {
      id: config.client_id || 'debug'
    })
  }

  sendReaction (id, message) {
    this._socket.emit('send_reaction', { message_id: id, message })
  }

  getNewMessages () {
    this._socket.emit('get_new_messages')
  }
}
