export const deDeTimeagoLocale = (number, index, totalSec) => {
  // number: the timeago / timein number;
  // index: the index of array below;
  // totalSec: total seconds between date to be formatted and today's date;
  return [
    ['gerade eben', 'jetzt gerade'],
    ['vor %s Sekunden', 'in %s Sekunden'],
    ['vor einer Minute', 'in einer Minute'],
    ['vor %s Minuten', 'in %s Minuten'],
    ['vor einer Stunde', 'in einer Stunde'],
    ['vor %s Stunden', 'in %s Stunden'],
    ['vor einem Tag', 'in einem Tag'],
    ['vor %s Tagen', 'in %s Tagen'],
    ['vor einer Woche', 'in einer Woche'],
    ['vor %s Wochen', 'in %s Wochen'],
    ['vor einem Monat', 'in einem Monat'],
    ['vor %s Monaten', 'in %s Monaten'],
    ['vor einem Jahr', 'in einem Jahr'],
    ['vor %s Jahren', 'in %s Jahren']
  ][index];
};

export default deDeTimeagoLocale
