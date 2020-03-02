import i18n from 'i18n'

i18n.configure({
  directory: 'src/lang'
})

i18n.setLocale('de_uplifting')

console.log(i18n.__('voice'))
console.log(i18n.__n('greeting', 'greeting', 0))
console.log(i18n.__n('greeting', 'greeting', 1))
console.log(i18n.__n('greeting', 'greeting', 15))
console.log(i18n.__('messageHeader', new Date().toLocaleString('de')))
console.log(i18n.__('noMoreMessages'))
console.log(i18n.__('endOfMessage'))
console.log(i18n.__('updateAvailable'))

