// import { makeTTSRequest } from './tts.js'
//
// makeTTSRequest('Ende der Nachricht. Wählen Sie ihre gewünschte Reaktion oder wählen sie Raute, um die Nachricht erneut abzuspielen.')
//   .then(filename => {
//     playSound(filename)
//     setTimeout(() => { playSound(filename) }, 2000)
//   })

import { Gpio } from 'onoff'

const dialPin = new Gpio(4, 'in')
const pulsePin = new Gpio(5, 'in', 'falling', { debounceTimeout: 50 })

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
  console.log(`DIAL Value changed to ${value}`)
})

process.on('SIGINT', _ => {
  dialPin.unexport()
  pulsePin.unexport()
})
