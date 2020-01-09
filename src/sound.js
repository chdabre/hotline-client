import { spawn } from "child_process"
import { promises as fsp } from 'fs'
import TTSProvider from './tts.js'

export default class SoundManager {
  constructor () {
    this._currentPlayers = []
  }

  playSoundTTS (text, cache = true) {
    if (!this._ttsProvider) this._ttsProvider = new TTSProvider({ name: 'de-DE-Wavenet-C', languageCode: 'de-DE' })
    return new Promise((resolve, reject) => {
      this._ttsProvider.makeTTSRequest(text)
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
        player = spawn('/usr/bin/mplayer', ['-ao', 'alsa:device=plug=dmix', '-cache', '16384', filename])
      }
      this._currentPlayers.push(player)

      player.stdout.on('data', (out) => console.log(out.toString()))
      player.stderr.on('data', (err) => console.error(err.toString()))
      player.on('close', function (code) {
        if (code > 0) reject(new Error('Process failed with code '  + code))
        else resolve(filename)
      })
    }))
  }

  stopAll () {
    console.log(`[SOUND] Stop sound on ${ this._currentPlayers.length } players`)
    this._currentPlayers.forEach(player => player.kill('SIGINT'))
    this._currentPlayers = []
  }

  isPlaying () {
    return this._currentPlayers.length > 0
  }
}
