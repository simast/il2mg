/** @copyright Simas Toleikis, 2015 */
"use strict";

var Item = require("../item");
var MCU = require("./MCU");

// Entity block
function MCU_TR_Entity() {

	// Call parent constructor
	MCU.apply(this, arguments);

	this.Enabled = 1;
}

MCU_TR_Entity.prototype = Object.create(MCU.prototype);
MCU_TR_Entity.prototype.typeID = 30;

// Entity report type ID constants
MCU_TR_Entity.REPORT_SPAWNED = 0;
MCU_TR_Entity.REPORT_TARGET_ATTACKED = 1;
MCU_TR_Entity.REPORT_AREA_ATTACKED = 2;
MCU_TR_Entity.REPORT_TOOK_OFF = 3;
MCU_TR_Entity.REPORT_LANDED = 4;

/**
 * Add an entity report event.
 *
 * @param {number} type Report type ID.
 * @param {object} command Source command item.
 * @param {object} target Target command item.
 */
MCU_TR_Entity.prototype.addReport = function(type, command, target) {

	var reportsItem;

	// Find OnReports child item
	if (this.items && this.items.length) {

		for (var item of this.items) {

			if (item.type === "OnReports") {

				reportsItem = item;
				break;
			}
		}
	}

	// Create a new OnReports child item
	if (!reportsItem) {

		reportsItem = new Item("OnReports");
		this.addItem(reportsItem);
	}

	// Add a new OnReport item
	var reportItem = new Item("OnReport");

	reportItem.Type = type;
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