import Transmitter from 'transmitter-framework';

import Storage      from './storage.es';

import Interval     from './interval.es';
import Day          from './day.es';

import ListView     from './list_view.es';
import IntervalView from './interval_view.es';
import DayView      from './day_view.es';


const intervalList = new Transmitter.Nodes.List();

intervalList.createItem = function () {
  return new Interval();
};

const dayList = new Transmitter.Nodes.List();

dayList.createItem = function () {
  return new Day();
};

const storage = new Storage('worklogger');

const intervalListView = new ListView(IntervalView);
const dayListView = new ListView(DayView);

Transmitter.Transmission.prototype.loggingIsEnabled = false;

Transmitter.startTransmission( (tr) => {
  storage.createChannel(intervalList).init(tr);
  storage.load(tr);
  intervalListView.createChannel(intervalList).init(tr);
  dayListView.createChannel(dayList).init(tr);
  intervalListView.init(tr);
  dayListView.init(tr);
});

document.body.appendChild(intervalListView.element);
document.body.appendChild(dayListView.element);
