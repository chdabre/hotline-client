import { spawn } from 'child_process'
import { makeTTSRequest } from './tts.js'

makeTTSRequest('Ende der Nachricht. Ich liebe Sie.')

const gstreamer = spawn('/usr/bin/gst-launch-1.0', ['filesrc location=54ea92a2754c510bb08ebf019a48ef4f.ogg ! oggdemux ! vorbisdec ! audioconvert ! audioresample ! alsasink'])
gstreamer.stdout.on('data', (data) => {
  console.log(`child stdout:\n${data}`)
})

gstreamer.stderr.on('data', (data) => {
  console.error(`child stderr:\n${data}`)
})
gstreamer.on('close', function (code) {
  console.log('closed', code)
});
