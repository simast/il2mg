/** @copyright Simas Toleikis, 2015 */
"use strict";

var Item = require("../item");

// Base MCU item
function MCU() {

	this.Targets = [];
	this.Objects = [];
}

MCU.prototype = Object.create(Item.prototype);

/**
 * Add an event (abstract base function).
 *
 * @param {string} type Event type name.
 * @param {object} target Target command item.
 */
MCU.addEvent = function(type, target) {
	
	// Validate event type
	if (typeof this.EVENTS !== "object" || this.EVENTS[type] === undefined) {
		throw new Error("Invalid item event type.");
	}
	
	// Validate event target command item
	if (!(target instanceof MCU)) {
		throw new Error("Invalid event target command item.");
	}
	
	// Child event item name constants
	var ITEM_ON_EVENTS = "OnEvents";
	var ITEM_ON_EVENT = "OnEvent";
	
	var eventsItem;

	// Find existing events container item
	if (this.items && this.items.length) {

		for (var item of this.items) {

			if (item.type === ITEM_ON_EVENTS) {

				eventsItem = item;
				break;
			}
		}
	}

	// Create a new events container child item
	if (!eventsItem) {

		eventsItem = new Item(ITEM_ON_EVENTS);
		this.addItem(eventsItem);
	}

	// Add a new event item
	var eventItem = new Item(ITEM_ON_EVENT);
	
	// TODO: Ignore duplicate/existing events

	eventItem.Type = this.EVENTS[type];
	eventItem.TarId = target.Index;
	
	eventsItem.addItem(eventItem);
};

/**
 * Get binary representation of the item.
 *
 * @param {object} index Binary data index object.
 * @returns {Buffer} Binary representation of the item.
 */
MCU.prototype.toBinary = function(index) {

	var size = 9;

	if (Array.isArray(this.Targets)) {
		size += this.Targets.length * 4;
	}

	if (Array.isArray(this.Objects)) {
		size += this.Objects.length * 4;
	}

	var buffer = new Buffer(size);

	// Enabled
	this.writeUInt8(buffer, this.Enabled !== undefined ? this.Enabled : 1);

	// Targets list
	this.writeUInt32Array(buffer, this.Targets);

	// Objects list
	this.writeUInt32Array(buffer, this.Objects);

	return [
		Item.prototype.toBinary.apply(this, arguments),
		buffer
	];
};

module.exports = MCU;