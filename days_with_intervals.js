// import {inspect} from 'util';
import * as Transmitter from 'transmitter-framework/index.es';

import {compareDatetimes} from './date_utils';

export default class DaysWithIntervals {

  constructor() {
    this.collection = new Transmitter.Nodes.OrderedMapNode();
  }

  createChannel(days, intervals) {
    const ch = new Transmitter.Channels.CompositeChannel();

    ch.defineSimpleChannel()
      .inForwardDirection()
      .fromSources(days.collection, intervals.withDays)
      .toTarget(this.collection)
      .withTransform(
        ([daysPayload, intsPayload], tr) => {
          const dayIndexes = daysPayload.map( (day) => day.date ).joinValues();
          const intIndexes = intsPayload.joinValues();

          return dayIndexes.zip(intIndexes)
            .map( ([days, ints]) => fillRange(days, ints) )
            .splitValues().updateMapByValue(
              (dayIndex) => new DayWithIntervals(dayIndex).init(tr)
            );
        }
      );

    const groupedIntervals = new Transmitter.Nodes.OrderedMapNode();

    ch.defineSimpleChannel()
      .inForwardDirection()
      .fromSources(this.collection, intervals.withDays)
      .toTarget(groupedIntervals)
      .withTransform(
        ([daysPayload, intervalsPayload]) =>
          daysPayload.joinValues().zip(intervalsPayload.joinEntries())
            .map( ([daysWithIntervals, indexedIntervals]) =>
              groupIntervalsForDays(daysWithIntervals, indexedIntervals)
            )
            .splitEntries()
      );

    ch.defineFlatteningChannel()
      .inForwardDirection()
      .withFlat(groupedIntervals)
      .withNestedAsDerived(
        this.collection,
        (dayWithIntervals) => dayWithIntervals.intervalsValue
      );

    return ch;
  }
}


class DayWithIntervals {
  constructor(dayIndex) {
    this.dayIndex = dayIndex;
    this.intervalsValue = new Transmitter.Nodes.ValueNode();
    this.intervalSet = new Transmitter.Nodes.OrderedSetNode();
  }

  init(tr) {
    new Transmitter.Channels.SimpleChannel()
      .inForwardDirection()
      .fromSource(this.intervalsValue)
      .toTarget(this.intervalSet)
      .withTransform(
        (payload) => payload.splitValues().updateSetByValue( (i) => i )
      )
      .init(tr);

    return this;
  }
}

function fillRange(dayIndexes, intIndexes) {
  const range = [];
  const endpoints = [
    dayIndexes[0],
    intIndexes[0],
    dayIndexes[dayIndexes.length - 1],
    intIndexes[intIndexes.length - 1]
  ].filter( (date) => date != null && date.isValid() )
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
    result.push([dayIndex, intervals]);
    while (intsI < indexedInts.length) {
      const [int, intIndex] = indexedInts[intsI];
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
