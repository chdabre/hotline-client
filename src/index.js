import { spawn } from 'child_process'
import { makeTTSRequest } from './tts.js'

let currentPlayer = null

makeTTSRequest('Ende der Nachricht. Wählen Sie ihre gewünschte Reaktion oder wählen sie Raute, um die Nachricht erneut abzuspielen.')
  .then(filename => {
    playSound(filename)
    setTimeout(() => { playSound(filename) }, 2000)
  })

function playSound (filename) {
  return new Promise(((resolve, reject) => {
    if (currentPlayer) currentPlayer.kill('SIGINT')
    currentPlayer = spawn('/usr/bin/mplayer', ['-ao', 'alsa:device=plug=dmix', filename])
    currentPlayer.stderr.on('data', (data) => {
      console.log(`[PLAYER] stderr:\n${data}`)
    })
    currentPlayer.on('close', function (code) {
      currentPlayer = null
      //if (code > 0) reject(new Error('Process failed with code '  + code))
      //else resolve()
      resolve()
    })
  }))
}
