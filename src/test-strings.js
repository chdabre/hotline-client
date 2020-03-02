import i18n from 'i18n'

i18n.configure({
  default_locale: 'de_normal',
  directory: 'src/lang'
})

let errors = 0
i18n.getLocales().forEach(loc => {
  try {
    i18n.setLocale(loc)
    console.log(`[${loc}]`)

    console.log(i18n.__('voice'))
    console.log(i18n.__n('greeting', 'greeting', 0))
    console.log(i18n.__n('greeting', 'greeting', 1))
    console.log(i18n.__n('greeting', 'greeting', 15))
    console.log(i18n.__('messageHeader', new Date().toLocaleString('de')))
    console.log(i18n.__('noMoreMessages'))
    console.log(i18n.__('endOfMessage'))
    console.log(i18n.__('updateAvailable'))

    console.log('OK\n')
  } catch (e) {
    console.error('ERROR in locale ' + loc + ':' + e)
    errors++
  }
})

console.log(`Tests succeded with ${errors} Errors.`)
