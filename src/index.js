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

const dialPin = new Gpio(DIAL_PIN_BCM, 'in')
// const pulsePin = new Gpio(PULSE_PIN_BCM, 'in')
const pulsePin = new Gpio(PULSE_PIN_BCM, 'in', 'both', { debounceTimeout: 50 })

pulsePin.watch((err, value) => {
  if (err) {
    throw err
  }
  console.log(`PULSE Value changed to ${value}`)
})

// const watchInterval = setInterval(() => {
//   dialPin.read().then(value => {
//     console.log('Dial Pin Value: ', value)
//   })
// }, 50)

process.on('SIGINT', _ => {
  dialPin.unexport()
  pulsePin.unexport()
  // clearInterval(watchInterval)
})
