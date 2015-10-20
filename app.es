import Transmitter from 'transmitter-framework';

import Interval from './interval.es';
import IntervalListView from './interval_list_view.es';
import Storage from './storage.es';


const intervalList = new Transmitter.Nodes.List();

intervalList.createInterval = function () {
  return new Interval();
};

const intervalListView = new IntervalListView();

const storage = new Storage('worklogger');

Transmitter.Transmission.prototype.loggingIsEnabled = false;


Transmitter.startTransmission( (tr) => {
  storage.createChannel(intervalList).init(tr);
  storage.load(tr);
  intervalListView.createChannel(intervalList).init(tr);
  intervalListView.init(tr);
});

document.body.appendChild(intervalListView.element);
