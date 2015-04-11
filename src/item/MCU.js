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