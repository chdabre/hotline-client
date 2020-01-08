import { spawn } from "child_process"

export default class SoundManager {
  constructor (props) {
    this._currentPlayer = null
  }

  playSound (filename) {
    const self = this
    return new Promise(((resolve, reject) => {
      if (this._currentPlayer) this._currentPlayer.kill('SIGINT')
      this._currentPlayer = spawn('/usr/bin/mplayer', ['-ao', 'alsa:device=plug=dmix', filename])
      this._currentPlayer.stderr.on('data', (data) => {
        console.log(`[PLAYER] stderr:\n${data}`)
      })
      this._currentPlayer.on('close', function (code) {
        self._currentPlayer = null
        //if (code > 0) reject(new Error('Process failed with code '  + code))
        //else resolve()
        resolve(code)
      })
    }))
  }

  stopSound () {
    if (this._currentPlayer) {
      this._currentPlayer.kill('SIGINT')
      this._currentPlayer = null
    }
  }
}
