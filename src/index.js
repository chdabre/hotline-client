// import { makeTTSRequest } from './tts.js'
//
// makeTTSRequest('Ende der Nachricht. Wählen Sie ihre gewünschte Reaktion oder wählen sie Raute, um die Nachricht erneut abzuspielen.')
//   .then(filename => {
//     playSound(filename)
//     setTimeout(() => { playSound(filename) }, 2000)
//   })

import GpioManager from './io.js'
import SoundManager from './sound.js'

const dialConfig = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']

class PhoneContext {
  constructor () {
    this.gpioManager = new GpioManager()
    this.soundManager = new SoundManager()

    this._setupListeners()
    this._state = new StateIdle(this)
  }

  _setupListeners() {
    this.gpioManager.on('cradle', value => {
      switch (value) {
        case GpioManager.CRADLE_UP:
          this.gpioManager.setLed(GpioManager.LED_ON)
          this._state.onCradleUp()
          break
        case GpioManager.CRADLE_DOWN:
          this.gpioManager.setLed(GpioManager.LED_OFF)
          this._state.onCradleDown()
          break
      }
    })

    this.gpioManager.on('dial', value => this._state.onDialInput(dialConfig[value]))
  }

  setState (newState) {
    this._state =  newState
  }
}

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

  onDialInput(input) { console.log(`[DIAL] ${input}`) }
}

class StateIdle extends PhoneState {
  onCradleUp (cradleState) {
    this._context.setState(new StateGreeting(this._context))
  }

  _init () {
    this._context.soundManager.stopSound()
  }
}

class StateGreeting extends PhoneState {
  _init () {
    this._context.soundManager.playSoundTTS('Hallo. Sie haben leider keine neuen Nachrichten. Bitte Legen Sie den Hörer auf.')
      .then(() => this._context.soundManager.playSound('http://91.121.134.23:8100/stream', true))
  }
}

new PhoneContext()
