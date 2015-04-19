/** @copyright Simas Toleikis, 2015 */
"use strict";

var Item = require("../item");

// Ground
function Ground() {

	this.DamageThreshold = 1;
	this.DamageReport = Item.DEFAULT_DAMAGE_REPORT;
}

Ground.prototype = Object.create(Item.prototype);
Ground.prototype.typeID = 7;

/**
 * Get binary representation of the item.
 *
 * @param {object} index Binary data index object.
 * @returns {Buffer} Binary representation of the item.
 */
Ground.prototype.toBinary = function(index) {

	var buffer = new Buffer(9);

	// LinkTrId
	this.writeUInt32(buffer, this.LinkTrId || 0);

	// DamageThreshold
	this.writeUInt8(buffer, this.DamageThreshold);

	// DamageReport
	this.writeUInt8(buffer, this.DamageReport);

	// Unknown data
	this.writeUInt8(buffer, 0);
	this.writeUInt8(buffer, 0);
	this.writeUInt8(buffer, 0);

	return [
		Item.prototype.toBinary.apply(this, arguments),
		buffer
	];
};

module.exports = Ground;