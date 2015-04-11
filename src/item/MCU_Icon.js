/** @copyright Simas Toleikis, 2015 */
"use strict";

var MCU = require("./MCU");

// Icon item
function MCU_Icon() {

	// Call parent constructor
	MCU.apply(this, arguments);

	this.Enabled = 1;
}

MCU_Icon.prototype = Object.create(MCU.prototype);
MCU_Icon.prototype.typeID = 35;

/**
 * Get binary representation of the item.
 *
 * @param {object} index Binary data index object.
 * @returns {Buffer} Binary representation of the item.
 */
MCU_Icon.prototype.toBinary = function(index) {

	var size = 32;

	if (Array.isArray(this.Coalitions)) {
		size += this.Coalitions.length * 4;
	}

	var buffer = new Buffer(size);

	// IconId
	this.writeUInt32(buffer, this.IconId || 0);

	// RColor
	this.writeUInt32(buffer, this.RColor || 0);

	// GColor
	this.writeUInt32(buffer, this.GColor || 0);

	// BColor
	this.writeUInt32(buffer, this.BColor || 0);

	// LineType
	this.writeUInt32(buffer, this.LineType || 0);

	// LCName
	this.writeUInt32(buffer, this.LCName || 0);

	// LCDesc
	this.writeUInt32(buffer, this.LCDesc || 0);

	// Coalitions
	this.writeUInt32Array(buffer, this.Coalitions || []);

	return MCU.prototype.toBinary.apply(this, arguments).concat(buffer);
};

module.exports = MCU_Icon;