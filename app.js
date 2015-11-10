import * as Transmitter from 'transmitter-framework/index.es';

import Storage         from './storage';
import DayStorage      from './day_storage';
import IntervalStorage from './interval_storage';

import Interval from './interval';
import Day      from './day';

import ListView     from './list_view';
import IntervalView from './interval_view';
import DayView      from './day_view';


const intervalList = new Transmitter.Nodes.List();

intervalList.createItem = function () {
  return new Interval();
};

const dayList = new Transmitter.Nodes.List();

dayList.createItem = function () {
  return new Day();
};

const intervalStorage = new Storage('worklogger-intervals', IntervalStorage);
const dayStorage = new Storage('worklogger-days', DayStorage);

const intervalListView = new ListView(IntervalView);
const dayListView = new ListView(DayView);

Transmitter.Transmission.prototype.loggingIsEnabled = false;

Transmitter.startTransmission( (tr) => {
  intervalStorage.createChannel(intervalList).init(tr);
  dayStorage.createChannel(dayList).init(tr);

  intervalStorage.load(tr);
  dayStorage.load(tr);

  intervalListView.createChannel(intervalList).init(tr);
  dayListView.createChannel(dayList).init(tr);

  intervalListView.init(tr);
  dayListView.init(tr);
});

document.body.appendChild(intervalListView.element);
document.body.appendChild(dayListView.element);
