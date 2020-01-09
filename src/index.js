import GpioManager from './io.js'
import SoundManager from './sound.js'
import SocketManager from './socket.js'

const dialConfig = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']

/**
 * Represents the application state
 */
class PhoneContext {
  constructor () {
    this.gpioManager = new GpioManager()
    this.soundManager = new SoundManager()
    this.socketManager = new SocketManager()

    this._setupListeners()

    // Initialize state
    this._state = new StateIdle(this)
  }

  /**
   * Start listening to gpio events
   * @private
   */
  _setupListeners() {
    this.gpioManager.on('cradle', value => {
      if (value === GpioManager.CRADLE_UP) this._state.onCradleUp()
      else if (value === GpioManager.CRADLE_DOWN) this._state.onCradleDown()
    })

    this.gpioManager.on('dial', value => this._state.onDialInput(dialConfig[value]))
  }

  /**
   * Set a new application state
   * @param newState { PhoneState } - The state which replaces the old state
   */
  setState (newState) {
    this._state = newState
  }
}

/**
 * Represents a state the application can be in
 */
class PhoneState {
  constructor (context) {
    this._context = context
    console.log(`[STATE CHANGE] - ${ this.constructor.name }`)
    this._init()
  }

  _init () {}
  onCradleUp () {
    this._context.gpioManager.setLed(GpioManager.LED_ON)
  }
  onCradleDown () {
    this._context.gpioManager.setLed(GpioManager.LED_OFF)
    this._context.setState(new StateIdle(this._context))
  }

  onDialInput(input) { console.log(`[DIAL] ${input}`) }
}

/**
 * The "hung up" state - The handset is in the cradle and nothing is happening.
 */
class StateIdle extends PhoneState {
  onCradleUp (cradleState) {
    this._context.setState(new StateGreeting(this._context))
  }

  _init () {
    this._context.soundManager.stopAll()
  }
}

/**
 * The Handset has just been picked up
 */
class StateGreeting extends PhoneState {
  _init () {
    this._context.soundManager.playSoundTTS('Hallo, du kleines verwahrlostes Sackhaar. Deine Mailbox ist leer. Und glaub nicht, dass sich das so schnell ändern wird.')
      .catch(() => {})
  }
}

new PhoneContext()
