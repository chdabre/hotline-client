import { spawn } from "child_process"
import { promises as fsp } from 'fs'
import TTSProvider from './tts.js'
import GpioManager from './io.js'

export default class SoundManager {
  constructor (context) {
    // PhoneContext
    this._context = context

    this._currentPlayers = []
  }

  playSoundTTS (text, voiceName = 'de-DE-Wavenet-C', cache = true) {
    const ttsProvider = new TTSProvider({ name: voiceName, languageCode: 'de-DE' })
    return new Promise((resolve, reject) => {
      ttsProvider.makeTTSRequest(text)
        .then(filename => this.playSound(filename, false))
        .then(filename => {
          if (!cache) fsp.unlink(filename).then(() => resolve())
          else resolve()
        })
        .catch(error => reject(error))
    })
  }

  playSound (filename, mplayer = false, amp = false) {
    if (process.env.DISABLE_HARDWARE) return new Promise((resolve => resolve(filename)))
    if (amp || this._context.speakerMode) this._context.gpioManager.setAmp(GpioManager.AMP_ON).catch(() => {})

    return new Promise(((resolve, reject) => {
      // Don't attempt to open a player instance if you're not on a real device
      if (this.isPlaying()) this.stopAll()

      let player, decoder;
      if (!mplayer) {
        decoder = spawn('/usr/bin/opusdec', ['--force-wav', '--quiet', filename, '-'])
        player = spawn('/usr/bin/aplay', ['-Dplug:dmix'])
        decoder.stdout.pipe(player.stdin).on('error', () => {})
        this._currentPlayers.push(decoder)
      } else {
        console.log('[MPLAYER] ' + filename)
        player = spawn('/usr/bin/mplayer', ['-ao', 'alsa:device=plug=dmix', '-cache', '16384', filename])
      }
      this._currentPlayers.push(player)

      player.stdout.on('data', (out) => {})
      player.stderr.on('data', (err) => console.log('[PLAYER] ' + err.toString()))
      player.on('close', (code) => {
        if (code > 0) reject(new Error('Process failed with code '  + code))
        else {
          this._context.gpioManager.setAmp(GpioManager.AMP_OFF)
            .then(() => resolve(filename))
            .catch(() => {})
        }
      })
    }))
  }

  stopAll () {
    console.log(`[SOUND] Stop sound on ${ this._currentPlayers.length } players`)
    this._currentPlayers.forEach(player => player.kill('SIGKILL'))
    this._currentPlayers = []
  }

  isPlaying () {
    return this._currentPlayers.length > 0
  }
}
