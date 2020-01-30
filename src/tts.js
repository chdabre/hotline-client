import textToSpeech from '@google-cloud/text-to-speech'
import { promises as fsp } from 'fs'
import fs from 'fs'
import crypto from 'crypto'

export default class TTSProvider {
  static get SOUND_CACHE_DIR () { return './media' }

  constructor (voiceSettings) {
    this._ttsClient = new textToSpeech.TextToSpeechClient()
    this._voiceSettings = voiceSettings
  }

  makeTTSRequest (text) {
    console.log(`[TTS] Creating TTS for: ${text}`)

    const request = {
      input: { ssml: `<speak>${text}</speak>` },
      voice: this._voiceSettings,
      // Select the type of audio encoding
      audioConfig: {
        audioEncoding: 'OGG_OPUS',
        effectsProfileId: [ 'telephony-class-application' ],
      },
    }

    // Hash the filename to create a text-related unique identifier
    const fileName = crypto.createHash('md5')
      .update(text + JSON.stringify(this._voiceSettings))
      .digest('hex')
      + '.ogg'

    const pathName = TTSProvider.SOUND_CACHE_DIR + '/' + fileName

    return new Promise((resolve, reject) => {
      // Check if a cached version of the requested text exists
      if (fs.existsSync(pathName)) {
        console.log('[TTS] Serving cached version...')
        resolve(pathName)
      } else {
        this._ttsClient.synthesizeSpeech(request)
          // Write file to File System
          .then(response => fsp.writeFile(pathName, response[0].audioContent, 'binary'))
          .then(() => resolve(pathName))
          .catch(error => reject(error))
      }
    })
  }
}
