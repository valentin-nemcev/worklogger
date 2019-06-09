// import {inspect} from 'util';
import * as Transmitter from 'transmitter-framework/index.es';

import {formatDateKey, parseDateKey} from './date_utils';

export default class DaysWithIntervals {

  constructor() {
    this.collection = new Transmitter.Nodes.OrderedMapNode();
  }

  createChannel(dayTargets, intervals) {
    const ch = new Transmitter.Channels.CompositeChannel();

    ch.defineSimpleChannel()
      .inForwardDirection()
      .fromSources(dayTargets.collection, intervals.withDays)
      .toTarget(this.collection)
      .withTransform(
        ([daysPayload, intsPayload], tr) => {
          const dayIndexes = daysPayload
            .map( (day) => day.dateIndex )
            .collapseValues();
          const intIndexes = intsPayload.collapseValues();

          return dayIndexes.zip(intIndexes)
            .map( ([dayTargets, ints]) => fillRange(dayTargets, ints) )
            .expandEntries().updateMapByKey(
              (dayIndex) => new DayWithIntervals(dayIndex).init(tr)
            );
        }
      );

    ch.defineFlatteningChannel()
      .inForwardDirection()
      .withTransformFlat(
        (payload) => payload.groupKeysByValue().unflattenToSequences()
      )
      .withFlat(intervals.withDays)
      .withNestedAsDerived(
        this.collection,
        (dayWithIntervals) => dayWithIntervals.intervalSet
      );

    ch.defineFlatteningChannel()
      .inBackwardDirection()
      .withFlat(intervals.collection)
      .withNestedAsDerived(
        this.collection,
        (dayWithIntervals) => dayWithIntervals.intervalSet
      );

    ch.defineFlatteningChannel()
      .inForwardDirection()
      .withTransformFlat(
        (payload) => payload.map( (d) => [d]).unflattenToSequences()
      )
      .withFlat(dayTargets.collection)
      .withNestedAsDerived(
        this.collection,
        (dayWithIntervals) => dayWithIntervals.dayOptional
      );

    return ch;
  }
}


class DayWithIntervals {
  constructor(dayIndex) {
    this.dayIndex = dayIndex;
    this.intervalSet = new Transmitter.Nodes.OrderedSetNode();
    this.dayOptional = new Transmitter.Nodes.OptionalNode();
  }

  init() {

    return this;
  }
}

function fillRange(dayIndexes, intIndexes) {
  dayIndexes.sort();
  intIndexes.sort();
  const range = [];
  const endpoints = [
    dayIndexes[0],
    intIndexes[0],
    dayIndexes[dayIndexes.length - 1],
    intIndexes[intIndexes.length - 1]
  ].filter( (date) => date != null ).sort();

  if (endpoints.length === 0) return [];

  const start = parseDateKey(endpoints[0]);
  const end = parseDateKey(endpoints[endpoints.length - 1]);

  let current = start;
  while (!current.isAfter(end)) {
    range.push([formatDateKey(current), current]);
    current = current.clone().add(1, 'day');
  }
  return range;
}
