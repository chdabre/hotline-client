import i18n from 'i18n'
import GpioManager from './io.js'
import SoundManager from './sound.js'
import SocketManager from './socket.js'

/**
 * Configure the mapping of emojis to the dialer.
 * Number mapping: [1,2,3,4,5,6,7,8,9,0] This means array index 9 would correspond to number 0 on the dialer.
 * @type {string[]}
 */
const dialConfig = ['❤️', '😂', '🍆', '🍑', '😡', '🦕', '🍻', '😊', '👌', '#']

/**
 * Represents the application state
 */
class PhoneContext {
  constructor () {
    this.gpioManager = new GpioManager(this)
    this.soundManager = new SoundManager(this)
    this.socketManager = new SocketManager(this)

    i18n.configure({
      locales: ['de_normal'],
      defaultLocale: 'de_normal',
      directory: 'src/lang'
    })
    i18n.setLocale('de_normal')

    this._setupListeners()

    this.newMessages = []
    this.currentMessage = null

    /**
     * Initialize state
     * @type {PhoneState}
     * @private
     */
    this._state = new StateIdle(this)
  }

  /**
   * Start listening to gpio events
   * @private
   */
  _setupListeners() {
    // Cradle Events
    this.gpioManager.on('cradle', value => {
      if (value === GpioManager.CRADLE_UP) this._state.onCradleUp()
      else if (value === GpioManager.CRADLE_DOWN) this._state.onCradleDown()
    })

    // Dial Events
    this.gpioManager.on('dial', value => this._state.onDialInput(dialConfig[value]))

    // Connection Initialization
    this.socketManager.on('init', msg => this._onInit(msg))
  }

  /**
   * Set a new application state
   * @param newState { PhoneState } - The state which replaces the old state
   */
  setState (newState) {
    this._state = newState
  }

  /**
   * Set the i18n locale to a random available locale.
   */
  pickRandomLocale () {
    const locales = i18n.getLocales()
    const locale = locales[(Math.random() * locales.length) | 0]
    i18n.setLocale(locale)
    console.log(`[LOCALE] ${locale}`)
  }

  _onInit (msg) {
    console.log('[PHONE] Sucessfully authorized with server.')
    console.log(msg.hasMessages ? 'New messages available': 'No new messages.')
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
    this._context.pickRandomLocale()

    this._context.socketManager.getNewMessages()
      .then(messages => {
        const messageCount = messages.messages.length
        this._context.newMessages = messages.messages

        this._context.soundManager.playSoundTTS(i18n.__n('greeting', 'greeting', messageCount))
          .then(() => {
            if (messageCount > 0 ) this._context.setState(new StateReadMessage(this._context))
            else this._context.setState(new StateTransactionEnd(this._context))
          })
          .catch(() => {})

        if (messageCount > 0) {

        }
        else {
          this._context.soundManager.playSoundTTS(i18n.__n('greeting', 'greeting', messageCount))
            .then(() => this._context.setState(new StateReadMessage(this._context)))
            .catch(() => {})
        }
      })
  }
}

/**
 * Read out new messages until there are no more.
 */
class StateReadMessage extends PhoneState {
  _init () {
    const message = this._context.newMessages.shift()
    if (typeof message !== 'undefined') {
      this._context.currentMessage = message
      this._context.soundManager.playSoundTTS(
        i18n.__('messageHeader', new Date(message.date).toLocaleString('de'))
      )
        .then(() => this._context.soundManager.playSound(message.url, true))
        .then(() => this._context.setState(new StateExpectResponse(this._context)))
        .catch((e) => console.log(e))
    } else {
      this._context.setState(new StateNoMoreMessages(this._context))
    }
  }
}

/**
 * There are no new messages.
 */
class StateNoMoreMessages extends PhoneState {
  _init () {
    this._context.soundManager.playSoundTTS(i18n.__('noMoreMessages'))
      .then(() => this._context.setState(new StateTransactionEnd(this._context)))
      .catch(() => {})
  }
}

/**
 * Read out new messages until there are no more.
 */
class StateExpectResponse extends PhoneState {
  _init () {
    this._context.soundManager.playSoundTTS(i18n.__('endOfMessage'))
      .catch(() => {})
  }

  onDialInput (input) {
    if (input === '#') {
      this._context.newMessages.unshift(this._context.currentMessage)
      this._context.setState(new StateReadMessage(this._context))
    } else {
      this._context.socketManager.sendReaction(this._context.currentMessage.id, input)
        .then(() => this._context.setState(new StateReadMessage(this._context)))
    }
  }
}

/**
 * I have nothing more to say.
 */
class StateTransactionEnd extends PhoneState {
  _init () {
  }
}

// Initialize the state
new PhoneContext()
