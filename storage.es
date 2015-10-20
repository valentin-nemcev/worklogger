import Transmitter from 'transmitter-framework';

function parseJSONWithoutThrowing(str) {
  try {
    return JSON.parse(str);
  } catch(e) {
    return null;
  }
}

function createSerializedIntervalChannel(interval, serializedVar) {
  const ch = new Transmitter.Channels.CompositeChannel();

  ch.defineSimpleChannel()
    .inForwardDirection()
    .fromSources(interval.startVar, interval.endVar, interval.tagVar)
    .toTarget(serializedVar)
    .withTransform( ([payload, ...otherPayloads]) =>
        payload.merge(...otherPayloads).map( ([start, end, tag]) =>
          ({
            start: interval.serializeDatetime(start),
            end: interval.serializeDatetime(end),
            tag
          }))
      );

  ch.defineSimpleChannel()
    .inBackwardDirection()
    .fromSource(serializedVar)
    .toTargets(interval.startVar, interval.endVar, interval.tagVar)
    .withTransform( (payload) =>
        payload.map( (serialized) => {
          const {start, end, tag} = Object(serialized);
          return [
            interval.unserializeDatetime(start),
            interval.unserializeDatetime(end),
            tag
          ];
        }).separate()
      );

  return ch;
}

export default class Storage {
  constructor(name) {
    this.localStorageVar =
      new Transmitter.Nodes.PropertyVariable(window.localStorage, name);
  }

  load(tr) {
    this.localStorageVar.originate(tr);
  }

  createChannel(intervalList) {
    const ch = new Transmitter.Channels.CompositeChannel();

    ch.serializedVar = new Transmitter.Nodes.Variable();

    ch.defineVariableChannel()
      .withOrigin(ch.serializedVar)
      .withMapOrigin(JSON.stringify)
      .withDerived(this.localStorageVar)
      .withMapDerived( (json) => Array.from(parseJSONWithoutThrowing(json)) );

    ch.serializedVarList = new Transmitter.Nodes.List();

    ch.defineSimpleChannel()
      .inBackwardDirection()
      .fromSource(ch.serializedVar)
      .toTarget(ch.serializedVarList)
      .withTransform( (localStoragePayload) =>
        localStoragePayload
          .toSetList()
          .updateMatching(
            () => new Transmitter.Nodes.Variable(),
            () => true
          )
      );

    ch.serializedChannelForwardChannelVar =
      new Transmitter.ChannelNodes.DynamicChannelVariable('sources', () =>
        new Transmitter.Channels.SimpleChannel()
          .inForwardDirection()
          .toTarget(ch.serializedVar)
          .withTransform( (serializedPayloads) =>
            serializedPayloads.flatten() )
      );

    ch.serializedChannelBackwardChannelVar =
      new Transmitter.ChannelNodes.DynamicChannelVariable('targets', () =>
        new Transmitter.Channels.SimpleChannel()
          .inBackwardDirection()
          .fromSource(ch.serializedVar)
          .withTransform( (serializedPayload) =>
            serializedPayload
              .toSetList()
              .unflatten()
          )
      );

    ch.defineSimpleChannel()
      .fromSource(ch.serializedVarList)
      .toConnectionTargets(
          ch.serializedChannelBackwardChannelVar,
          ch.serializedChannelForwardChannelVar);

    ch.defineListChannel()
      .withOrigin(intervalList)
      .withMapOrigin( (interval) => {
        const v = new Transmitter.Nodes.Variable();
        v.interval = interval;
        return v;
      })
      .withDerived(ch.serializedVarList)
      .withMapDerived( (serializedVar) => {
        const interval = intervalList.createItem();
        serializedVar.interval = interval;
        return interval;
      })
      .withMatchOriginDerived( (interval, serializedVar) =>
          serializedVar.interval == interval
      )
      .withOriginDerivedChannel( (interval, serializedVar) =>
          createSerializedIntervalChannel(interval, serializedVar));

    return ch;
  }
}
