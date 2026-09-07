const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

function dayOfWeekFor(date) {
  return DAY_NAMES[date.getDay()];
}

module.exports = { dayOfWeekFor };
