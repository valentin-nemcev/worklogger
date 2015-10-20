import Transmitter from 'transmitter-framework';

function parseJSONWithoutThrowing(str) {
  try {
    return JSON.parse(str);
  } catch(e) {
    return null;
  }
}

export default class Storage {
  constructor(name, ItemStorage) {
    this.ItemStorage = ItemStorage;
    this.localStorageVar =
      new Transmitter.Nodes.PropertyVariable(window.localStorage, name);
  }

  load(tr) {
    this.localStorageVar.originate(tr);
  }

  createChannel(itemList) {
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
      .withOrigin(itemList)
      .withMapOrigin( (item) => {
        const v = new Transmitter.Nodes.Variable();
        v.item = item;
        return v;
      })
      .withDerived(ch.serializedVarList)
      .withMapDerived( (serializedVar) => {
        const item = itemList.createItem();
        serializedVar.item = item;
        return item;
      })
      .withMatchOriginDerived( (item, serializedVar) =>
          serializedVar.item == item
      )
      .withOriginDerivedChannel( (item, serializedVar) =>
          this.ItemStorage.createSerializedItemChannel(item, serializedVar));

    return ch;
  }
}
