import * as Transmitter from 'transmitter-framework/index.es';

import Storage         from './storage';
import DayStorage      from './day_storage';
import IntervalStorage from './interval_storage';

import {Days, Intervals} from './days_intervals';

import ListView     from './list_view';
import IntervalView from './interval_view';
import DayView      from './day_view';

import DaysWithIntervals from './days_with_intervals';
import DaysWithIntervalsView from './days_with_intervals_view';


const intervalStorage = new Storage('worklogger-intervals', IntervalStorage);
const dayStorage = new Storage('worklogger-days', DayStorage);

const daysWithIntervals = new DaysWithIntervals();


const intervalListView = new ListView(IntervalView);
const dayListView = new ListView(DayView);
const daysWithIntervalsView =
  new DaysWithIntervalsView({DayView, IntervalView});

Transmitter.Transmission.prototype.loggingIsEnabled = false;

Transmitter.startTransmission( (tr) => {
  const intervals = new Intervals(tr);
  const days = new Days(tr);

  daysWithIntervals.createChannel(days, intervals).init(tr);

  intervalStorage.createChannel(intervals).init(tr);
  dayStorage.createChannel(days).init(tr);

  intervalStorage.load(tr);
  dayStorage.load(tr);

  intervalListView.createChannel(intervals).init(tr, true);
  // dayListView.createChannel(days).init(tr);
  // daysWithIntervalsView.createChannel(daysWithIntervals).init(tr);

  intervalListView.init(tr);
  // dayListView.init(tr);
  // daysWithIntervalsView.init(tr);
});


function title(text) {
  const el = document.createElement('h3');
  el.innerText = text;
  return el;
}

document.body.appendChild(title('Intervals'));
document.body.appendChild(intervalListView.element);
document.body.appendChild(title('Days'));
document.body.appendChild(dayListView.element);
document.body.appendChild(title('Days with intervals'));
document.body.appendChild(daysWithIntervalsView.element);
