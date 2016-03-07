import moment from 'moment';

Object.assign(moment.fn, {
  inspect() { return `moment(${this.format()})`; }
});


const dateFormat = 'YYYY-MM-DD';
const datetimeFormat = 'YYYY-MM-DD HH:mm';

export function compareDatetimes(a, b) {
  return a.diff(b);
}

export function minDate(...dates) {
  let min;
  for (const date of dates) {
    if (min == null || date.isBefore(min)) min = date;
  }
  return min;
}

export function maxDate(...dates) {
  let max;
  for (const date of dates) {
    if (max == null || date.isAfter(max)) max = date;
  }
  return max;
}

export function serializeDate(date) {
  return date.format('YYYY-MM-DD');
}

export function unserializeDate(dateStr) {
  dateStr = dateStr || '';
  return moment(dateStr, 'YYYY-MM-DD');
}

export function formatDate(date) {
  return date.format(dateFormat);
}

export function formatDateKey(date) {
  return date.format('YYYY-MM-DD');
}

export function parseDateKey(dateStr) {
  return moment(dateStr, 'YYYY-MM-DD');
}

export function parseDate(dateStr) {
  dateStr = (dateStr || '').trim();
  return dateStr ? moment(dateStr, dateFormat) : moment().startOf('day');
}

export function serializeDatetime(datetime) {
  return datetime.toJSON();
}

export function unserializeDatetime(datetimeStr) {
  datetimeStr = datetimeStr || '';
  return moment(datetimeStr);
}

export function formatDatetime(datetime) {
  return datetime.format(datetimeFormat);
}

export function parseDatetime(datetimeStr) {
  datetimeStr = (datetimeStr || '').trim();
  return datetimeStr ? moment(datetimeStr, datetimeFormat) : null;
}
