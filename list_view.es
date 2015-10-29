import Transmitter from 'transmitter-framework/index.es';

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
      new Transmitter.DOMElement.AttributeVar(this.showView.element, 'hidden');

    el.appendChild(this.showView.element);

    this.editView = ItemViews.createEdit();
    this.editViewIsHidden =
      new Transmitter.DOMElement.AttributeVar(this.editView.element, 'hidden');

    el.appendChild(this.editView.element);

    this.isEditedVar = new Transmitter.Nodes.Variable();
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
      .toTarget(this.isEditedVar)
      .withTransform( (startEditPayload) =>
          startEditPayload.map( () => true ) );

    ch.defineSimpleChannel()
      .inBackwardDirection()
      .fromSource(this.editView.completeEditEvt)
      .toTarget(this.isEditedVar)
      .withTransform( (completeEditPayload) =>
          completeEditPayload.map( () => false ) );

    ch.defineSimpleChannel()
      .inForwardDirection()
      .fromSource(this.isEditedVar)
      .toTarget(this.editViewIsHidden)
      .withTransform( (isEditedPayload) =>
          isEditedPayload.map( (isEdited) => !isEdited ) );

    ch.defineSimpleChannel()
      .inForwardDirection()
      .fromSource(this.isEditedVar)
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

  createRemoveChannel(itemList) {
    return this.editView.createRemoveChannel(itemList, this.item);
  }
}


export default class ListView {
  constructor(ItemViews) {
    this.ItemViews = ItemViews;
    const el = this.element = document.createElement('div');

    this.itemListEl = el.appendChild(document.createElement('div'));
    this.itemListEl.classList.add('item-list');

    this.itemViewList = new Transmitter.Nodes.List();
    this.itemElementList =
      new Transmitter.DOMElement.ChildrenList(this.itemListEl);

    this.createItemView = ItemViews.createAddActionView();
    el.appendChild(this.createItemView.element);
  }

  init(tr) {
    new Transmitter.Channels.ListChannel()
      .inForwardDirection()
      .withOrigin(this.itemViewList)
      .withDerived(this.itemElementList)
      .withMapOrigin( (itemView) => itemView.element )
      .withMatchOriginDerived(
        (itemView, itemEl) => itemView.element == itemEl )
      .init(tr);
    return this;
  }

  createChannel(itemList) {
    const ch = new Transmitter.Channels.CompositeChannel();

    ch.defineListChannel()
      .inForwardDirection()
      .withOrigin(itemList)
      .withDerived(this.itemViewList)
      .withMapOrigin( (item, tr) => new ItemView(this.ItemViews, item).init(tr) )
      .withMatchOriginDerived(
        (item, itemView) => itemView.item == item )
      .withOriginDerivedChannel(
        (item, itemView) => itemView.createChannel(item)
      )
      .withMatchOriginDerivedChannel( (item, itemView, channel) =>
        channel.item == item && channel.itemView == itemView
      );

    ch.removeItemChannelList = new Transmitter.ChannelNodes.ChannelList();

    ch.defineSimpleChannel()
      .fromSource(this.itemViewList)
      .toConnectionTarget(ch.removeItemChannelList)
      .withTransform( (itemViewsPayload) =>
        itemViewsPayload.map( (itemView) =>
          itemView.createRemoveChannel(itemList) )
      );

    ch.defineSimpleChannel()
      .inBackwardDirection()
      .fromSource(this.createItemView.createItemEvt)
      .toTarget(itemList)
      .withTransform( (createItemPayload, tr) =>
          createItemPayload
          .map( () => itemList.createItem().init(tr) )
          .toAppendListElement()
      );

    return ch;
  }
}
