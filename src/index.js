import i18n from 'i18n'
import GpioManager from './io.js'
import SoundManager from './sound.js'
import SocketManager from './socket.js'
import { checkForUpdates } from './utils.js'

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

    // New Message Notification
    this.socketManager.on('notify', () => this._state.onNotify())

    // New Message data
    this.socketManager.on('messages', msg => {
      this.gpioManager.setLed(msg.hasMessages ? GpioManager.LED_ON : GpioManager.LED_OFF)
      this.newMessages = msg.messages
      console.log('[MESSAGES] new message count: ' + this.newMessages.length)
      this._state.onUpdate()
    })
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
    this.soundManager.playSoundTTS(i18n.__('connected'))
      .catch(() => {})

    this.ready = true
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
  onCradleUp () {}
  onCradleDown () {
    this._context.setState(new StateIdle(this._context))
  }
  onNotify () {}
  onUpdate () {}

  onDialInput(input) { console.log(`[DIAL] ${input}`) }
}

/**
 * The "hung up" state - The handset is in the cradle and nothing is happening.
 */
class StateIdle extends PhoneState {
  onCradleUp () {
    if (this._context.ready) this._context.setState(new StateGreeting(this._context))
  }

  _init () {
    this._context.soundManager.stopAll()
  }

  onNotify () {
    this._context.gpioManager.setLed(GpioManager.LED_ON)
    this._context.soundManager.playSound('./src/assets/ring.opus', false, true)
      .catch(() => {})
  }
}

/**
 * The Handset has just been picked up
 */
class StateGreeting extends PhoneState {
  _init () {
    this._context.pickRandomLocale()

    const messageCount = this._context.newMessages.length
    this._context.soundManager.playSoundTTS(i18n.__n('greeting', 'greeting', messageCount))
      .then(() => {
        if (messageCount > 0 ) this._context.setState(new StateReadMessage(this._context))
        else this._context.setState(new StateTransactionEnd(this._context))
      })
      .catch(error => console.log(error))
  }
}

/**
 * Read out new messages until there are no more.
 */
class StateReadMessage extends PhoneState {
  _init () {
    const message = this._context.newMessages[0]
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
    this._context.gpioManager.setLed(GpioManager.LED_OFF)
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
    if (input !== '#') {
      this._context.socketManager.sendReaction(this._context.currentMessage.id, input)
      this._context.setState(new StateReadMessage(this._context))
    } else {
      this._context.setState(new StateWaitForUpdate(this._context, StateReadMessage))
    }
  }
}

/**
 * I have nothing more to say.
 */
class StateTransactionEnd extends PhoneState {
  _init () {
    checkForUpdates()
      .then(hasUpdate => {
        return hasUpdate ? this._context.soundManager.playSoundTTS(i18n.__('updateAvailable')) : Promise.resolve()
      })
      .catch(() => {})
  }
}

class StateWaitForUpdate extends PhoneState {
  constructor (context, nextState) {
    super(context)
    this.nextState = nextState
  }

  onUpdate () {
    console.log('[WAIT FOR UPDATE] update received!')
    this._context.setState(new this.nextState(this._context))
  }
}

// Initialize the state
new PhoneContext()
