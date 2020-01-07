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

const dialPin = new Gpio(DIAL_PIN_BCM, 'in', 'falling', { debounceTimeout: 10 })
const pulsePin = new Gpio(PULSE_PIN_BCM, 'in', 'falling', { debounceTimeout: 10 })

dialPin.watch((err, value) => {
  if (err) {
    throw err
  }
  console.log(`DIAL Value changed to ${value}`)
})

pulsePin.watch((err, value) => {
  if (err) {
    throw err
  }
  console.log(`PULSE Value changed to ${value}`)
})

process.on('SIGINT', _ => {
  dialPin.unexport()
  pulsePin.unexport()
})
