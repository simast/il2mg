/** @copyright Simas Toleikis, 2015 */
"use strict";

var BlockParent = require("../block");

// Icon block
function MCU_Icon() {

}

MCU_Icon.prototype = Object.create(BlockParent.prototype);
MCU_Icon.prototype.id = 35;

/**
 * Get binary representation of the block.
 *
 * @param {object} index Binary data index object.
 * @returns {Buffer} Binary representation of the block.
 */
MCU_Icon.prototype.toBinary = function(index) {

	var size = 41;

	if (Array.isArray(this.Coalitions)) {
		size += this.Coalitions.length * 4;
	}

	var buffer = new Buffer(size);

	// Enabled
	this.writeUInt8(buffer, this.Enabled !== undefined ? this.Enabled : 1);

	// Targets/objects list length
	this.writeUInt32(buffer, 0);
	this.writeUInt32(buffer, 0);

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

	return [
		BlockParent.prototype.toBinary.apply(this, arguments),
		buffer
	];
};

module.exports = MCU_Icon;