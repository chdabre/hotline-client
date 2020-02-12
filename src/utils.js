import { exec } from "child_process"

export function getLocalRef () {
  return new Promise(((resolve, reject) =>{
    exec('git rev-parse HEAD', function(err, stdout) {
      if (!err) {
        resolve(stdout.substr(0,40))
      } else {
        reject(err)
      }
    })
  }))
}

export function getRemoteRef () {
  return new Promise(((resolve, reject) =>{
    exec('git ls-remote origin refs/heads/master', function(err, stdout) {
      if (!err) {
        resolve(stdout.substr(0,40))
      } else {
        reject(err)
      }
    })
  }))
}


export async function checkForUpdates () {
  return await getLocalRef() !== await getRemoteRef()
}

export function restart () {
  return new Promise(((resolve, reject) => {
    exec('service hotline restart', ((error, stdout) => {
      if (!error) resolve()
      else reject(error)
    }))
  }))
}

export function shutdown () {
  return new Promise(((resolve, reject) => {
    exec('shutdown now', ((error, stdout) => {
      if (!error) resolve()
      else reject(error)
    }))
  }))
}
