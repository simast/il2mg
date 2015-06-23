/** @copyright Simas Toleikis, 2015 */
"use strict";

var Item = require("../item");
var MCU = require("./MCU");

// Entity item
function MCU_TR_Entity() {

	// Call parent constructor
	MCU.apply(this, arguments);

	this.Enabled = 1;
}

MCU_TR_Entity.prototype = Object.create(MCU.prototype, {
	
	// Valid Entity event type name and ID constants
	EVENTS: {
		value: {
			OnTODO: 1
		}
	}
});

MCU_TR_Entity.prototype.typeID = 30;

// Entity report type name and ID constants
var reportType = {
	OnSpawned: 0,
	OnTargetAttacked: 1,
	OnAreaAttacked: 2,
	OnTookOff: 3,
	OnLanded: 4
};

// Events are available for Entity item
MCU_TR_Entity.prototype.addEvent = MCU.addEvent;

/**
 * Add an entity report event.
 *
 * @param {string} type Report type name.
 * @param {object} command Source command item.
 * @param {object} target Target command item.
 */
MCU_TR_Entity.prototype.addReport = function(type, command, target) {
	
	// Validate report type
	if (reportType[type] === undefined) {
		throw new Error("Invalid entity report type.");
	}
	
	// Validate report source and target command items
	if (!(command instanceof MCU) || !(target instanceof MCU)) {
		throw new Error("Invalid entity report source or target command item.");
	}

	// Child event item name constants
	var ITEM_ON_REPORTS = "OnReports";
	var ITEM_ON_REPORT = "OnReport";
	
	var reportsItem;

	// Find existing reports container child item
	if (this.items && this.items.length) {

		for (var item of this.items) {

			if (item.type === ITEM_ON_REPORTS) {

				reportsItem = item;
				break;
			}
		}
	}

	// Create a new reports container child item
	if (!reportsItem) {

		reportsItem = new Item(ITEM_ON_REPORTS);
		this.addItem(reportsItem);
	}

	// Add a new report item
	var reportItem = new Item(ITEM_ON_REPORT);
	
	// TODO: Ignore duplicate/existing reports

	reportItem.Type = reportType[type];
	reportItem.CmdId = command.Index;
	reportItem.TarId = target.Index;

	reportsItem.addItem(reportItem);
};

/**
 * Get binary representation of the item.
 *
 * @param {object} index Binary data index object.
 * @returns {Buffer} Binary representation of the item.
 */
MCU_TR_Entity.prototype.toBinary = function(index) {

	var size = 12;
	var reportItems = [];

	// Find OnReports item
	if (this.items && this.items.length) {

		var reportsItem;
		for (var item of this.items) {

			if (item.type === "OnReports") {

				reportsItem = item;
				break;
			}
		}

		if (reportsItem && reportsItem.items) {

			reportsItem.items.forEach(function(item) {

				if (item.type === "OnReport") {
					reportItems.push(item);
				}
			});
		}
	}

	size += reportItems.length * 12;

	var buffer = new Buffer(size);

	// OnEvents length
	this.writeUInt32(buffer, 0);

	// MisObjID
	this.writeUInt32(buffer, this.MisObjID || 0);

	// Number of OnReports->OnReport items
	this.writeUInt32(buffer, reportItems.length);

	// List of OnReport items
	reportItems.forEach(function(item) {

		this.writeUInt32(buffer, item.Type); // Report type
		this.writeUInt32(buffer, item.TarId); // Target command item ID
		this.writeUInt32(buffer, item.CmdId); // Source command item ID

	}, this);

	return MCU.prototype.toBinary.apply(this, arguments).concat(buffer);
};

module.exports = MCU_TR_Entity;