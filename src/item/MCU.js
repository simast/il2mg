/** @copyright Simas Toleikis, 2015 */
"use strict";

var Item = require("../item");

// Event and report child item name constants
var ITEM_ON_EVENTS = "OnEvents";
var ITEM_ON_EVENT = "OnEvent";
var ITEM_ON_REPORTS = "OnReports";
var ITEM_ON_REPORT = "OnReport";

// Base MCU item
function MCU() {

	this.Targets = [];
	this.Objects = [];

	// Events container item reference
	if (this.EVENTS) {
		Object.defineProperty(this, "events", {value: null, writable: true});
	}

	// Reports container item reference
	if (this.REPORTS) {
		Object.defineProperty(this, "reports", {value: null, writable: true});
	}
}

MCU.prototype = Object.create(Item.prototype);

/**
 * Add an event.
 *
 * @param {string} type Event type name.
 * @param {object} target Target command item.
 */
MCU.prototype.addEvent = function(type, target) {

	// Validate event type
	if (typeof this.EVENTS !== "object" || this.EVENTS[type] === undefined) {
		throw new Error("Invalid item event type.");
	}

	// Validate event target command item
	if (!(target instanceof MCU)) {
		throw new Error("Invalid event target command item.");
	}

	// Create a new events container child item
	if (!this.events) {

		this.events = new Item(ITEM_ON_EVENTS);
		this.addItem(this.events);
	}

	// Add a new event item
	var eventItem = new Item(ITEM_ON_EVENT);

	// TODO: Ignore duplicate/existing events

	eventItem.Type = this.EVENTS[type];
	eventItem.TarId = target.Index;

	this.events.addItem(eventItem);
};

/**
 * Add a report.
 *
 * @param {string} type Report type name.
 * @param {object} command Source command item.
 * @param {object} target Target command item.
 */
MCU.prototype.addReport = function(type, command, target) {
	
	// Validate report type
	if (typeof this.REPORTS !== "object" || this.REPORTS[type] === undefined) {
		throw new Error("Invalid item report type.");
	}
	
	// Validate report source and target command items
	if (!(command instanceof MCU) || !(target instanceof MCU)) {
		throw new Error("Invalid item report source or target command item.");
	}

	// Create a new reports container child item
	if (!this.reports) {

		this.reports = new Item(ITEM_ON_REPORTS);
		this.addItem(this.reports);
	}

	// Add a new report item
	var reportItem = new Item(ITEM_ON_REPORT);
	
	// TODO: Ignore duplicate/existing reports

	reportItem.Type = this.REPORTS[type];
	reportItem.CmdId = command.Index;
	reportItem.TarId = target.Index;

	this.reports.addItem(reportItem);
};

/**
 * Write events list to the given Buffer object.
 *
 * @param {Buffer} buffer Target buffer object.
 */
MCU.prototype.writeEvents = function(buffer) {

	var eventsCount = 0;

	if (this.events) {
		eventsCount = this.events.items.length;
	}

	// Number of event items
	this.writeUInt32(buffer, eventsCount);

	if (!this.events) {
		return;
	}

	// List of OnEvent items
	this.events.items.forEach(function(event) {

		this.writeUInt32(buffer, event.Type); // Event type
		this.writeUInt32(buffer, event.TarId); // Target command item ID

	}, this);
};

/**
 * Write reports list to the given Buffer object.
 *
 * @param {Buffer} buffer Target buffer object.
 */
MCU.prototype.writeReports = function(buffer) {

	var reportsCount = 0;

	if (this.reports) {
		reportsCount = this.reports.items.length;
	}

	// Number of report items
	this.writeUInt32(buffer, reportsCount);

	if (!this.reports) {
		return;
	}

	// List of OnReport items
	this.reports.items.forEach(function(report) {

		this.writeUInt32(buffer, report.Type); // Report type
		this.writeUInt32(buffer, report.TarId); // Target command item ID
		this.writeUInt32(buffer, report.CmdId); // Source command item ID

	}, this);
};

/**
 * Get binary representation of the item.
 *
 * @param {object} index Binary data index object.
 * @returns {Buffer} Binary representation of the item.
 */
MCU.prototype.toBinary = function* (index) {
	
	yield* Item.prototype.toBinary.apply(this, arguments);

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

	yield buffer;
};

module.exports = MCU;