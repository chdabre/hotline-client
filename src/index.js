import i18n from 'i18n'
import TimeAgo from 'javascript-time-ago'
import en from 'javascript-time-ago/locale/en/index.js'
import de from 'javascript-time-ago/locale/de/index.js'

import Chance from 'chance'
import GpioManager from './io.js'
import SoundManager from './sound.js'
import SocketManager from './socket.js'
import * as utils from './utils.js'

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
      directory: 'src/lang',
      objectNotation: true
    })
    i18n.setLocale('de_normal')
    TimeAgo.addLocale(en)
    TimeAgo.addLocale(de)

    this._setupListeners()

    this.newMessages = []
    this.currentMessage = null

    this.speakerMode = false

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
      if (value === GpioManager.CRADLE_UP) this._state.onCradleUp().catch(() => {})
      else this._state.onCradleDown().catch(() => {})
    })

    // Dial Events
    this.gpioManager.on('dial', value => this._state.onDialInput(dialConfig[value]))

    // Mute Events
    this.gpioManager.on('mute', value => this._onMuteStateChange(value))

    // Connection Initialization
    this.socketManager.on('init', msg => this._onInit(msg))
    this.socketManager.on('disconnect', msg => {
      this.ready = false
    })

    // New Message Notification
    this.socketManager.on('notify', () => this._state.onNotify().catch(() => {}))

    // New Message data
    this.socketManager.on('messages', msg => {
      this.gpioManager.setLed(msg.hasMessages ? GpioManager.LED_ON : GpioManager.LED_OFF)
      this.newMessages = msg.messages
      console.log('[MESSAGES] new message count: ' + this.newMessages.length)
      this._state.onUpdate().catch(() => {})
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
    // Key: Locale name, Value: Relative probability
    const locales = {
      'de_normal': 100,
      'de_sponsored': 8, // 8
      'de_pissed': 5, // 5
      'de_sad': 5, // 5
      'de_uplifting': 5, // 5
      'en_narrator': 5, // 5
      'en_fes': 3, // 3
      'de_kidnapping': 2, // 2
      'en_dom': 2, // 2
      'en_sub': 2, // 2
      'de_yoda': 1, // 1
      'dog_of_wisdom': 1, // 1
    }
    const locale = new Chance().weighted(Object.keys(locales), Object.values(locales))
    i18n.setLocale(locale)
    console.log(`[LOCALE] ${locale}`)
  }

  formatTimeago (date) {
    console.log(i18n.getLocale().substr(0,2))
    const timeAgo = new TimeAgo(i18n.getLocale().substr(0,2) === 'de' ? 'de' : 'en')
    return timeAgo.format(date)
  }

  /**
   * Enable / Disable speaker mode
   * @param enable {Boolean} If the speaker mode should be enabled
   */
  setSpeakerMode (enable) {
    if (enable) {
      this.gpioManager.setAmp(GpioManager.AMP_ON)
      this.speakerMode = true
    } else {
      this.speakerMode = false
      this.gpioManager.setAmp(GpioManager.AMP_OFF)
    }
  }

  _onInit (msg) {
    console.log('[PHONE] Sucessfully authorized with server.')
    console.log(msg.hasMessages ? 'New messages available': 'No new messages.')
    this.gpioManager.blinkLed(3).catch(() => {})
    this.ready = true
  }

  _onMuteStateChange (isUnmuted) {
    if (!isUnmuted) {
      this.gpioManager.blinkLed(2, 100).catch(() => {})
    }
  }
}

/**
 * Represents a state the application can be in
 */
class PhoneState {
  constructor (context) {
    console.log(`[STATE CHANGE] - ${ this.constructor.name }`)

    this._context = context
    this._cancelRequested = false

    this._init().catch(() => {})
  }

  async _init () {}

  async _cancel () {
    this._cancelRequested = true
    this._context.soundManager.stopAll()
    this._context.setSpeakerMode(false)
  }

  async onCradleUp () {}
  async onCradleDown () {
    await this._cancel()
    this._context.setState(new StateIdle(this._context))
  }
  async onNotify () {}
  async onUpdate () {}

  async onDialInput(input) {
    console.log(`[DIAL] ${input}`)
    if (input === '❤️') {
      console.log(`[AMP] Switch to speaker mode`)
      this._context.setSpeakerMode(true)
    }
  }
}

/**
 * The "hung up" state - The handset is in the cradle and nothing is happening.
 */
class StateIdle extends PhoneState {
  async onCradleUp () {
    await this._context.soundManager.playSound('./src/assets/dialtone.opus', false)

    if (this._context.ready) {
      this._context.setState(new StateGreeting(this._context))
    } else {
      await this._context.soundManager.playSoundTTS(i18n.__('notConnected'))
      this._context.setState(new StateMenu(this._context()))
    }
  }

  async onNotify () {
    this._context.gpioManager.setLed(GpioManager.LED_ON)
    const isUnmuted = await this._context.gpioManager.isUnmuted()
    if (isUnmuted) await this._context.soundManager.playSound('./src/assets/ring.opus', false, true)
  }
}

/**
 * The Handset has just been picked up
 */
class StateGreeting extends PhoneState {
  async _init () {
    this._context.pickRandomLocale()

    const messageCount = this._context.newMessages.length
    await this._context.soundManager.playSoundTTS(
      i18n.__n('greeting', 'greeting', messageCount),
      i18n.__('voice')
    )

    if (this._cancelRequested) return
    if (messageCount > 0) {
      this._context.setState(new StateReadMessage(this._context))
    } else {
      this._context.setState(new StateTransactionEnd(this._context))
    }
  }
}

/**
 * Read out new messages until there are no more.
 */
class StateReadMessage extends PhoneState {
  async _init () {
    const message = this._context.newMessages[0]
    if (typeof message !== 'undefined') {
      this._context.currentMessage = message
      await this._context.soundManager.playSoundTTS(
        //i18n.__('messageHeader', new Date(message.date).toLocaleString(i18n.getLocale().split('_')[0])),
        i18n.__('messageHeader', this._context.formatTimeago(new Date(message.date))),
        i18n.__('voice')
      )
      if (this._cancelRequested) return
      await this._context.soundManager.playSound(message.url, true)
      if (this._cancelRequested) return
      this._context.setState(new StateExpectResponse(this._context))
    } else {
      this._context.setState(new StateNoMoreMessages(this._context))
    }
  }
}

/**
 * There are no new messages.
 */
class StateNoMoreMessages extends PhoneState {
  async _init () {
    this._context.gpioManager.setLed(GpioManager.LED_OFF)
    await this._context.soundManager.playSoundTTS(
      i18n.__('noMoreMessages'),
      i18n.__('voice')
    )
    this._context.setState(new StateTransactionEnd(this._context))
  }
}

/**
 * Read out new messages until there are no more.
 */
class StateExpectResponse extends PhoneState {
  async _init () {
    await this._context.soundManager.playSoundTTS(i18n.__('endOfMessage'), i18n.__('voice'))
  }

  async onDialInput (input) {
    if (input !== '#') {
      this._context.socketManager.sendReaction(this._context.currentMessage.id, input)
      this._context.setState(new StateWaitForUpdate(this._context, StateReadMessage))
    } else {
      this._context.setState(new StateReadMessage(this._context))
    }
  }
}

/**
 * I have nothing more to say.
 */
class StateTransactionEnd extends PhoneState {
  async _init () {
    const hasUpdate = utils.checkForUpdates()
    if (hasUpdate && !this._cancelRequested) {
        await this._context.soundManager.playSoundTTS(
          i18n.__('updateAvailable'),
          i18n.__('voice')
        )
    }
  }

  async onDialInput (input) {
    if (input === '#') this._context.setState(new StateMenu(this._context))
  }
}

/**
 * Loads of different utility functions
 */
class StateMenu extends PhoneState {
  async _init () {
    i18n.setLocale('de_normal')
    await this._context.soundManager.playSoundTTS(i18n.__('menu.intro'))
  }

  async onDialInput (input) {
    console.log(input)
    switch (input) {
      case '❤️':
        this._context.soundManager.playSoundTTS(i18n.__('menu.restarting'))
          .then(() => utils.restart())
          .catch(() => {})
        break
      case '😂':
        this._context.soundManager.playSoundTTS(i18n.__('menu.ip', utils.getIp()))
          .catch(() => {})
        break
      case '#':
        this._context.soundManager.playSoundTTS(i18n.__('menu.shutdown'))
          .then(() => utils.shutdown())
          .catch(() => {})
        break
    }
  }
}

class StateWaitForUpdate extends PhoneState {
  constructor (context, nextState) {
    super(context)
    this.nextState = nextState
  }

  async onUpdate () {
    console.log('[WAIT FOR UPDATE] update received!')
    this._context.setState(new this.nextState(this._context))
  }
}

// Initialize the state
new PhoneContext()
