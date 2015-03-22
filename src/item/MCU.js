/** @copyright Simas Toleikis, 2015 */
"use strict";

var Item = require("../item");

// Abstract base MCU item
function MCU() {
	throw new Error();
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

	// Targets and Objects lists
	this.writeUInt32Array(buffer, this.Targets || []);
	this.writeUInt32Array(buffer, this.Objects || []);

	return [
		Item.prototype.toBinary.apply(this, arguments),
		buffer
	];
};

module.exports = MCU;