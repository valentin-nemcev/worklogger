// import {inspect} from 'util';
import * as Transmitter from 'transmitter-framework/index.es';

import {compareDatetimes} from './date_utils';

export default class DaysWithIntervals {

  constructor() {
    this.list = new Transmitter.Nodes.List();
  }

  createChannel(days, intervals) {
    const ch = new Transmitter.Channels.CompositeChannel();

    ch.defineSimpleChannel()
      .inForwardDirection()
      .fromSources(days.indexedList, intervals.indexedList)
      .toTarget(this.list)
      .withTransform(
        ([daysPayload, intsPayload]) => {
          const dayIndexes = daysPayload.map( ({index}) => index ).toValue();
          const intIndexes = intsPayload.map( ({index}) => index ).toValue();

          return dayIndexes.merge(intIndexes)
            .map( ([days, ints]) => fillRange(days, ints) )
            .toList().updateMatching(
              (dayIndex) => new DayWithIntervals(dayIndex),
              (dayIndex, dayWithIntervals) =>
                dayWithIntervals.dayIndex == dayIndex
            );
        }
      );

    const groupedIntervals = new Transmitter.Nodes.List();

    ch.defineSimpleChannel()
      .inForwardDirection()
      .fromSources(this.list, intervals.indexedList)
      .toTarget(groupedIntervals)
      .withTransform(
        ([daysPayload, intervalsPayload]) =>
          daysPayload.toValue().merge(intervalsPayload.toValue())
            .map( ([daysWithIntervals, indexedIntervals]) =>
              groupIntervalsForDays(daysWithIntervals, indexedIntervals)
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
  constructor(dayIndex) {
    this.dayIndex = dayIndex;
    this.intervalList = new Transmitter.Nodes.List();
  }
}

function fillRange(dayIndexes, intIndexes) {
  const range = [];
  const endpoints = [
    dayIndexes[0],
    intIndexes[0],
    dayIndexes[dayIndexes.length - 1],
    intIndexes[intIndexes.length - 1]
  ].filter( (date) => date != null )
    .map( (date) => date.clone().startOf('day'))
    .sort(compareDatetimes);

  if (endpoints.length === 0) return [];

  const start = endpoints[0];
  const end = endpoints[endpoints.length - 1];

  let current = start;
  while (!current.isAfter(end)) {
    range.push(current);
    current = current.clone().add(1, 'day');
  }
  return range;
}

function groupIntervalsForDays(daysWithIntervals, indexedInts) {
  let intsI = 0;
  const result = [];
  for (const {dayIndex} of daysWithIntervals) {
    const intervals = [];
    result.push(intervals);
    while (intsI < indexedInts.length) {
      const {index: intIndex, item: int} = indexedInts[intsI];
      if (intIndex.isAfter(dayIndex, 'day')) {
        break;
      } else {
        intervals.push(int);
        intsI++;
        continue;
      }
    }
  }
  return result;
}
