import { spawn } from "child_process"
import { promises as fsp } from 'fs'
import { makeTTSRequest } from './tts.js'

export default class SoundManager {
  constructor () {
    this._currentPlayers = []
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
      if (this.isPlaying()) this.stopAll()

      const player = mplayer ? spawn('/usr/bin/mplayer', ['-ao', 'alsa:device=plug=dmix', filename])
        : spawn('/bin/sh', ['-c', `/usr/bin/opusdec --force-wav --quiet ${filename} - | /usr/bin/aplay -Dplug:dmix`])

      // this._currentPlayer.stderr.on('data', (data) => {
      //   console.log(`[PLAYER] stderr:\n${data}`)
      // })

      player.on('close', function (code) {
        //if (code > 0) reject(new Error('Process failed with code '  + code))
        //else resolve()
        resolve(filename)
      })

      this._currentPlayers.push(player)
    }))
  }

  stopAll () {
    console.log(`Stop sound on ${ this._currentPlayers.length } players`)
    this._currentPlayers.forEach(player => player.kill('SIGTERM'))
    this._currentPlayers = []
  }

  isPlaying () {
    return this._currentPlayers.length > 0
  }
}
