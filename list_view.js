import * as Transmitter from 'transmitter-framework/index.es';

let itemLastDebugId = 0;

class ItemView {
  inspect() {
    return `[ItemView ${this.debugId} for ${this.item.inspect()}]`;
  }

  constructor(ItemViews, item) {
    this.item = item;

    this.debugId = itemLastDebugId++;

    const el = this.element = document.createElement('div');
    el.classList.add('item');

    this.showView = ItemViews.createShow();
    this.showViewIsHidden =
      new Transmitter.DOMElement.AttributeValue(this.showView.element, 'hidden');

    el.appendChild(this.showView.element);

    this.editView = ItemViews.createEdit();
    this.editViewIsHidden =
      new Transmitter.DOMElement.AttributeValue(this.editView.element, 'hidden');

    el.appendChild(this.editView.element);

    this.isEditedValue = new Transmitter.Nodes.ValueNode();
  }

  init(tr) {
    this.showView.init(tr);
    this.editView.init(tr);
    this._createIsEditedChannel().init(tr);
    return this;
  }

  _createIsEditedChannel() {
    const ch = new Transmitter.Channels.CompositeChannel();

    ch.defineSimpleChannel()
      .inBackwardDirection()
      .fromSource(this.showView.startEditEvt)
      .toTarget(this.isEditedValue)
      .withTransform( (startEditPayload) =>
          startEditPayload.map( () => true ) );

    ch.defineSimpleChannel()
      .inBackwardDirection()
      .fromSource(this.editView.completeEditEvt)
      .toTarget(this.isEditedValue)
      .withTransform( (completeEditPayload) =>
          completeEditPayload.map( () => false ) );

    ch.defineSimpleChannel()
      .inForwardDirection()
      .fromSource(this.isEditedValue)
      .toTarget(this.editViewIsHidden)
      .withTransform( (isEditedPayload) =>
          isEditedPayload.map( (isEdited) => !isEdited ) );

    ch.defineSimpleChannel()
      .inForwardDirection()
      .fromSource(this.isEditedValue)
      .toTarget(this.showViewIsHidden)
      .withTransform( (isEditedPayload) =>
          isEditedPayload.map( (isEdited) => isEdited ) );

    return ch;
  }

  createChannel(item) {
    const ch = new Transmitter.Channels.CompositeChannel();
    ch.item = item;
    ch.itemView = this;
    ch.addChannel(this.showView.createChannel(item));
    ch.addChannel(this.editView.createChannel(item));
    return ch;
  }

  createRemoveChannel(itemSet) {
    return this.editView.createRemoveChannel(itemSet, this.item);
  }
}


export default class ListView {
  constructor(ItemViews) {
    this.ItemViews = ItemViews;
    const el = this.element = document.createElement('div');

    this.itemListEl = el.appendChild(document.createElement('div'));
    this.itemListEl.classList.add('item-list');

    this.itemViewMap = new Transmitter.Nodes.OrderedMapNode();
    this.itemElementSet =
      new Transmitter.DOMElement.ChildrenSet(this.itemListEl);

    this.createItemView = ItemViews.createAddActionView();
    el.appendChild(this.createItemView.element);
  }

  init(tr) {
    new Transmitter.Channels.BidirectionalChannel()
      .inForwardDirection()
      .withOriginDerived(this.itemViewMap, this.itemElementSet)
      .updateSetByValue()
      .withMapOrigin( (itemView) => itemView.element )
      .init(tr);
    return this;
  }

  createChannel(items) {
    const ch = new Transmitter.Channels.CompositeChannel();

    ch.defineNestedBidirectionalChannel()
      .inForwardDirection()
      .withOriginDerived(items.collection, this.itemViewMap)
      .updateMapByValue()
      .withMapOrigin(
        (item, tr) => new ItemView(this.ItemViews, item).init(tr)
      )
      .withOriginDerivedChannel(
        (item, itemView) => itemView.createChannel(item)
      );

    ch.removeItemChannelList = new Transmitter.ChannelNodes.ChannelList();

    ch.defineNestedSimpleChannel()
      .fromSource(this.itemViewMap)
      .toChannelTarget(ch.removeItemChannelList)
      .withTransform( (itemViewsPayload) =>
        itemViewsPayload.map( (itemView) =>
          itemView.createRemoveChannel(items.collection) )
      );

    ch.addChannel(this.createItemView.createCreateChannel(items));

    return ch;
  }
}
