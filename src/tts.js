import textToSpeech from '@google-cloud/text-to-speech'
import { promises as fsp } from 'fs'
import crypto from 'crypto'

const client = new textToSpeech.TextToSpeechClient()
export function makeTTSRequest (text) {
  const request = {
    input: { text },
    // Select the language and SSML Voice Gender (optional)
    voice: { name: 'de-DE-Wavenet-C', languageCode: 'de-DE' },
    // Select the type of audio encoding
    audioConfig: {
      audioEncoding: 'OGG_OPUS',
      effectsProfileId: [ 'telephony-class-application' ],
    },
  }

  const fileName = crypto.createHash('md5').update(text).digest('hex') + '.ogg'
  return new Promise((resolve, reject) => {
    client.synthesizeSpeech(request)
      .then(response => fsp.writeFile(fileName, response[0].audioContent, 'binary'))
      .then(() => resolve(fileName))
      .catch(error => reject(error))
  })
}
