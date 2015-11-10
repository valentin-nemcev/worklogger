import * as Transmitter from 'transmitter-framework/index.es';

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
    this.localStorageValue =
      new Transmitter.Nodes.PropertyValue(window.localStorage, name);
  }

  load(tr) {
    this.localStorageValue.originate(tr);
  }

  createChannel(itemList) {
    const ch = new Transmitter.Channels.CompositeChannel();

    ch.serializedList = new Transmitter.Nodes.List();

    ch.defineBidirectionalChannel()
      .withOriginDerived(ch.serializedList, this.localStorageValue)
      .withTransformOrigin(
        (payload) => payload.toValue().map(JSON.stringify)
      )
      .withTransformDerived(
        (payload) => payload.map(parseJSONWithoutThrowing).toList()
      );

    ch.serializedValueList = new Transmitter.Nodes.List();

    ch.defineSimpleChannel()
      .inBackwardDirection()
      .fromSource(ch.serializedList)
      .toTarget(ch.serializedValueList)
      .withTransform( (localStoragePayload) =>
        localStoragePayload
          .updateMatching(
            () => new Transmitter.Nodes.Value(),
            () => true
          )
      );

    ch.defineFlatteningChannel()
      .withNested(ch.serializedValueList)
      .withFlat(ch.serializedList);

    ch.defineNestedBidirectionalChannel()
      .withOriginDerived(itemList, ch.serializedValueList)
      .withMatchOriginDerived( (item, serializedValue) =>
          serializedValue.item == item
      )
      .withMapOrigin( (item) => {
        const v = new Transmitter.Nodes.Value();
        v.item = item;
        return v;
      })
      .withMapDerived( (serializedValue) => {
        const item = itemList.createItem();
        serializedValue.item = item;
        return item;
      })
      .withOriginDerivedChannel( (item, serializedValue) =>
          this.ItemStorage.createSerializedItemChannel(item, serializedValue));

    return ch;
  }
}
