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

      let player, decoder;
      if (!mplayer) {
        decoder = spawn('/usr/bin/opusdec', ['--force-wav', '--quiet', filename, '-'])
        player = spawn('/usr/bin/aplay', ['-Dplug:dmix'])
        decoder.stdout.pipe(player.stdin).on('error', () => {})
        this._currentPlayers.push(decoder)
      } else {
        player = spawn('/usr/bin/mplayer', ['-ao', 'alsa:device=plug=dmix', filename])
      }
      this._currentPlayers.push(player)

      player.on('stderr', (err) => console.error(err))
      player.on('close', function (code) {
        if (code > 0) reject(new Error('Process failed with code '  + code))
        else resolve()
      })
    }))
  }

  stopAll () {
    console.log(`Stop sound on ${ this._currentPlayers.length } players`)
    this._currentPlayers.forEach(player => player.kill('SIGINT'))
    this._currentPlayers = []
  }

  isPlaying () {
    return this._currentPlayers.length > 0
  }
}
