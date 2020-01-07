// import { makeTTSRequest } from './tts.js'
//
// makeTTSRequest('Ende der Nachricht. Wählen Sie ihre gewünschte Reaktion oder wählen sie Raute, um die Nachricht erneut abzuspielen.')
//   .then(filename => {
//     playSound(filename)
//     setTimeout(() => { playSound(filename) }, 2000)
//   })

import wpi from 'wiring-op'

wpi.setup('wpo')

const DIAL_PIN = 8
const PULSE_PIN = 9

wpi.pinMode (DIAL_PIN, wpi.INPUT)
wpi.pinMode (PULSE_PIN, wpi.INPUT)
wpi.pullUpDnControl (DIAL_PIN, wpi.PUD_UP)
wpi.pullUpDnControl (PULSE_PIN, wpi.PUD_UP)

wpi.wiringPiISR(DIAL_PIN, wpi.INT_EDGE_FALLING, function(delta) {
  console.log('DIAL pin changed to LOW (', delta, ')');
})

wpi.wiringPiISR(PULSE_PIN, wpi.INT_EDGE_FALLING, function(delta) {
  console.log('PULSE pin changed to LOW (', delta, ')');
})
