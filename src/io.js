import EventEmitter from 'events'
import onoff from 'onoff'
const Gpio = onoff.Gpio

export default class GpioManager extends EventEmitter {
  // State constants
  static get CRADLE_UP () { return Gpio.HIGH }
  static get CRADLE_DOWN () { return Gpio.LOW }
  static get MUTE_OFF () { return Gpio.HIGH }
  static get MUTE_ON () { return Gpio.LOW }
  static get LED_ON () { return Gpio.HIGH }
  static get LED_OFF () { return Gpio.LOW }

  // Pins for rotary dial
  static get DIAL_PIN () { return 19 } // Connects to the DIAL output of the rotary dial
  static get PULSE_PIN () { return 18 } // Connects to the PULSE output of the rotary dial

  // Telephone-related pins
  static get CRADLE_PIN () { return 14 } // Connects to the cradle switch
  static get MUTE_PIN () { return 16 } // Connects to the mute switch
  static get LED_PIN () { return 15 } // Connects to the led

  constructor (context) {
    super()

    // PhoneContext
    this._context = context

    // Setup pins
    this._dialPin = new Gpio(GpioManager.DIAL_PIN, 'in', 'both', { debounceTimeout: 10 })
    this._pulsePin = new Gpio(GpioManager.PULSE_PIN, 'in', 'falling', { debounceTimeout: 10 })

    this._cradlePin = new Gpio(GpioManager.CRADLE_PIN, 'in', 'both', { debounceTimeout: 20 })
    this._mutePin = new Gpio(GpioManager.MUTE_PIN, 'in', 'both', { debounceTimeout: 20 })
    this._ledPin = new Gpio(GpioManager.LED_PIN, 'out')

    // Ensure Pins are properly unexported when the module is unloaded
    process.on('SIGINT', _ => {
      this._dialPin.unexport()
      this._pulsePin.unexport()
      this._cradlePin.unexport()
      this._mutePin.unexport()
      this._ledPin.unexport()
    })

    this._startWatchingDial()
    this._startWatchingCradle()
    this._startWatchingMute()

    // Initialize the LED as LOW
    this._ledPin.write(Gpio.LOW)
      .catch(err => {})
  }

  /**
   * Watch the rotary dial for input.
   * @emits dial - When a dialing operation has finished
   * @private
   */
  _startWatchingDial () {
    // Signifies if a dialing operation is currently in progress
    this._dialing = false
    // The last digit which was dialed. This only reflects the actual value if _dialing is false
    this._dialCounter = -1

    // Watch the DIAL pin for the start and end of a dialing operation
    this._dialPin.watch((err, value) => {
      if (err) {
      } else {
        if (value === Gpio.LOW) {
          this._dialing = true
          this._dialCounter = 1 // Has to be set to either 0 or 1 depending on the rotary dial model
        } else {
          if (this._dialing) {
            // Emit dial event when the dialing operation has finished
            // The value is between 0-9, so 1 lower than the actual number dialed
            this.emit('dial', this._dialCounter - 1)
          }
        }
      }
    })

    // Watch the PULSE pin for dialing pulses
    this._pulsePin.watch((err, value) => {
      if (err) {
      } else {
        if (value === Gpio.LOW && this._dialing) this._dialCounter++
      }
    })
  }

  /**
   * Watch the cradle if the handset has been picked up / hung up
   * @emits cradle - If the cradle position changed
   * @private
   */
  _startWatchingCradle () {
    this._cradlePin.watch((err, value) => {
      if (err) {
      } else {
        this.emit('cradle', value)
      }
    })
  }

  /**
   * Watch the mute switch
   * @emits mute - If the mute position changed
   * @private
   */
  _startWatchingMute () {
    this._mutePin.watch((err, value) => {
      if (err) {
      } else {
        this.emit('mute', value)
      }
    })
  }

  isMuted () {
    return this._mutePin.read()
  }

  setLed (value) {
    return this._ledPin.write(value)
  }
}
