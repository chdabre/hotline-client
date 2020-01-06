import { spawn } from 'child_process'
import { makeTTSRequest } from './tts.js'

makeTTSRequest('Ende der Nachricht. Wählen Sie ihre gewünschte Reaktion oder wählen sie Raute, um die Nachricht erneut abzuspielen.')
  .then(filename => {
    playSound(filename)
  })

function playSound (filename) {
  return new Promise(((resolve, reject) => {
    const player = spawn('/usr/bin/mplayer', ['-ao', 'alsa:device=plug=dmix', filename])
    player.stderr.on('data', (data) => {
      console.error(`[PLAYER] stderr:\n${data}`)
    })
    player.on('close', function (code) {
      if (code > 0) reject(new Error('Process failed with code '  + code))
      else resolve()
    })
  }))
}
