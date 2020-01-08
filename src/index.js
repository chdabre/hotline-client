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
    this._state = new StateIdle(this)

    this.gpioManager = new GpioManager()
    this.soundManager = new SoundManager()

    this._setupListeners()
  }

  _setupListeners() {
    this.gpioManager.on('cradle', value => {
      switch (value) {
        case GpioManager.CRADLE_UP:
          this._state.onCradleUp()
          break
        case GpioManager.CRADLE_DOWN:
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
  }

  onCradleUp () {}
  onCradleDown () {
    this._context.setState(new StateIdle(this._context))
  }

  onDialInput(input) { console.log(`[DIAL] ${input}`) }
}

class StateIdle extends PhoneState {
  onCradleUp (cradleState) {
    this._context.setState(new StateIdle(this._context))
  }
}

new PhoneContext()
