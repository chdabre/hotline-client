// import { makeTTSRequest } from './tts.js'
//
// makeTTSRequest('Ende der Nachricht. Wählen Sie ihre gewünschte Reaktion oder wählen sie Raute, um die Nachricht erneut abzuspielen.')
//   .then(filename => {
//     playSound(filename)
//     setTimeout(() => { playSound(filename) }, 2000)
//   })

import onoff from 'onoff'
const Gpio = onoff.Gpio

const DIAL_PIN_BCM = 4
const PULSE_PIN_BCM = 5

const dialPin = new Gpio(DIAL_PIN_BCM, 'in')
const pulsePin = new Gpio(PULSE_PIN_BCM, 'in')

const watchInterval = setInterval(() => {
  dialPin.read().then(value => {
    console.log('Dial Pin Value: ', value)
  })
}, 50)

process.on('SIGINT', _ => {
  dialPin.unexport()
  pulsePin.unexport()
  clearInterval(watchInterval)
})
