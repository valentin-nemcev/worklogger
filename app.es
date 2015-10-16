import Transmitter from 'transmitter-framework';

import Interval from './interval.es';
import IntervalListView from './interval_list_view.es';


const intervalList = new Transmitter.Nodes.List();

intervalList.createInterval = function () {
  return new Interval();
};

const intervalListView = new IntervalListView();

Transmitter.startTransmission( (tr) => {

  const i1 = new Interval().init(tr,
      {start: '2015-10-15 19:25', end: '2015-10-15 19:40', tag: 'test2'});

  const i2 = new Interval().init(tr,
      {start: '2015-10-15 20:50', end: '2015-10-15 21:00', tag: 'test1'});

  intervalList.init(tr, [i1, i2]);
  intervalListView.createChannel(intervalList).init(tr);
  intervalListView.init(tr);
});

document.body.appendChild(intervalListView.element);
