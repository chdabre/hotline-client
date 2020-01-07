// import { makeTTSRequest } from './tts.js'
//
// makeTTSRequest('Ende der Nachricht. Wählen Sie ihre gewünschte Reaktion oder wählen sie Raute, um die Nachricht erneut abzuspielen.')
//   .then(filename => {
//     playSound(filename)
//     setTimeout(() => { playSound(filename) }, 2000)
//   })

import onoff from 'onoff'
const Gpio = onoff.Gpio

const DIAL_PIN_BCM = 19
const PULSE_PIN_BCM = 18

const dialPin = new Gpio(DIAL_PIN_BCM, 'in', 'both', { debounceTimeout: 10 })
const pulsePin = new Gpio(PULSE_PIN_BCM, 'in', 'falling', { debounceTimeout: 10 })

let dialing = false
let dialCounter = 0

dialPin.watch((err, value) => {
  if (err) {
    throw err
  }
  if (value == 0) {
    console.log('START DIALING')
    dialing = true
    dialCounter = 1
  } else {
    console.log('STOP DIALING')
    console.log('Value: ', dialCounter)
  }
})

pulsePin.watch((err, value) => {
  if (err) {
    throw err
  }
  console.log(`PULSE`)
  if (dialing) dialCounter++
})

process.on('SIGINT', _ => {
  dialPin.unexport()
  pulsePin.unexport()
})
