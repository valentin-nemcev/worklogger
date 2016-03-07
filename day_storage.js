import * as Transmitter from 'transmitter-framework/index.es';

import {parseDateKey} from './date_utils';


export default {
  createItemByKey(tr, days, dayStr) {
    return days.createItem(tr, parseDateKey(dayStr));
  },
  createSerializedItemChannel(day, serializedValue) {
    const ch = new Transmitter.Channels.CompositeChannel();

    ch.defineSimpleChannel()
      .inForwardDirection()
      .fromSources(day.targetValue)
      .toTarget(serializedValue)
      .withTransform( ([payload, ...otherPayloads]) =>
          payload.zip(...otherPayloads).map( ([target]) =>
            ({
              target
            }))
          );

    ch.defineSimpleChannel()
      .inBackwardDirection()
      .fromSource(serializedValue)
      .toTargets(day.targetValue)
      .withTransform( (payload) =>
          payload.map( (serialized) => {
            const {target} = Object(serialized);
            return [
              target
            ];
          }).unzip(2)
          );

    return ch;
  }
};
