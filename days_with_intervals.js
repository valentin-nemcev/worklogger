import * as Transmitter from 'transmitter-framework/index.es';

export default class DaysWithIntervals {

  constructor() {
    this.list = new Transmitter.Nodes.List();
  }

  createChannel(days, intervals) {
    const ch = new Transmitter.Channels.CompositeChannel();

    ch.defineSimpleChannel()
      .inForwardDirection()
      .fromSource(days.indexedList)
      .toTarget(this.list)
      .withTransform(
        (payload) => payload.updateMatching(
          ({item: day}) => new DayWithIntervals(day),
          ({item: day}, dayWithIntervals) => dayWithIntervals.day == day
        )
      );

    const groupedIntervals = new Transmitter.Nodes.List();

    ch.defineSimpleChannel()
      .inForwardDirection()
      .fromSources(days.indexedList, intervals.indexedList)
      .toTarget(groupedIntervals)
      .withTransform(
        ([daysPayload, intervalsPayload]) =>
          daysPayload.toValue().merge(intervalsPayload.toValue())
            .map( ([indexedDays, indexedIntervals]) =>
              [...groupIntervalsForDays(
                Array.values(indexedDays), Array.values(indexedIntervals)
              )]
            )
            .toList()
      );

    ch.defineFlatteningChannel()
      .inForwardDirection()
      .withFlat(groupedIntervals)
      .withNestedAsDerived(
        this.list,
        (dayWithIntervals) => dayWithIntervals.intervalList
      );

    return ch;
  }
}


class DayWithIntervals {
  constructor(day) {
    this.day = day;
    this.intervalList = new Transmitter.Nodes.List();
  }
}

function *groupIntervalsForDays(indexedDays, indexedInts) {
  for (const {index: dayIndex} of indexedDays) {
    const intervals = [];
    for (;;) {
      const {value: intWithIndex, done} = indexedInts.next();
      const {index: intIndex, item: int} = intWithIndex || {};
      if (done || dayIndex.isBefore(intIndex, 'day')) {
        yield intervals;
        break;
      } else if (dayIndex.isSame(intIndex, 'day')) {
        intervals.push(int);
        continue;
      } else if (dayIndex.isAfter(intIndex, 'day')) {
        continue;
      }
    }
  }
}
