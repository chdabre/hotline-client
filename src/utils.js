import { exec } from "child_process"

export function getGitRef () {
  return new Promise(((resolve, reject) =>{
    exec('git rev-parse HEAD', function(err, stdout) {
      if (!err) {
        resolve(stdout)
      } else {
        reject(err)
      }
    })
  }))
}
