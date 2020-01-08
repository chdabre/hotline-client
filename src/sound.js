import { spawn } from "child_process"
import { promises as fsp } from 'fs'
import { makeTTSRequest } from './tts.js'

export default class SoundManager {
  constructor (props) {
    this._currentPlayer = null
  }

  playSoundTTS (text, cache = true) {
    return new Promise((resolve, reject) => {
      makeTTSRequest(text)
        .then(filename => this.playSound(filename))
        .then(filename => {
          if (!cache) fsp.unlink(filename).then(() => resolve())
          else resolve()
        })
        .catch(error => reject(error))
    })
  }

  playSound (filename, mplayer = false) {
    const self = this
    return new Promise(((resolve, reject) => {
      if (this._currentPlayer) this._currentPlayer.kill('SIGINT')
      if (mplayer) {
        this._currentPlayer = spawn('/usr/bin/mplayer', ['-ao', 'alsa:device=plug=dmix', filename])
      } else {
        this._currentPlayer = spawn('/bin/sh', ['-c', `/usr/bin/opusdec --force-wav --quiet ${filename} - | /usr/bin/aplay -Dplug:dmix`])
      }
      this._currentPlayer.stderr.on('data', (data) => {
        console.log(`[PLAYER] stderr:\n${data}`)
      })
      this._currentPlayer.on('close', function (code) {
        self._currentPlayer = null
        //if (code > 0) reject(new Error('Process failed with code '  + code))
        //else resolve()
        resolve(filename)
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
