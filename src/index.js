import { spawn } from 'child_process'
import { makeTTSRequest } from './tts.js'

let currentSound = null

makeTTSRequest('Ende der Nachricht. Wählen Sie ihre gewünschte Reaktion oder wählen sie Raute, um die Nachricht erneut abzuspielen.')
  .then(filename => {
    playSound(filename)
    setTimeout(() => playSound(filename), 1000)
  })

function playSound (filename) {
  return new Promise(((resolve, reject) => {
    if (currentSound) currentSound.kill('SIGINT')
    const player = spawn('/usr/bin/mplayer', ['-ao', 'alsa:device=plug=dmix', filename])
    player.stderr.on('data', (data) => {
      console.error(`[PLAYER] stderr:\n${data}`)
    })
    player.on('close', function (code) {
      currentSound = null
      if (code > 0) reject(new Error('Process failed with code '  + code))
      else resolve()
    })
  }))
}
