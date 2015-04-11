/** @copyright Simas Toleikis, 2015 */
"use strict";

var Item = require("../item");

// Block item
function Block() {

	this.DeleteAfterDeath = 0;
	this.DamageThreshold = 1;
	this.Country = Item.DEFAULT_COUNTRY;
	this.DamageReport = Item.DEFAULT_DAMAGE_REPORT;
	this.Durability = Item.DEFAULT_DURABILITY;
}

Block.prototype = Object.create(Item.prototype);
Block.prototype.typeID = 1;

/**
 * Get binary representation of the item.
 *
 * @param {object} index Binary data index object.
 * @returns {Buffer} Binary representation of the item.
 */
Block.prototype.toBinary = function(index) {

	var buffer = new Buffer(13);

	// LinkTrId
	this.writeUInt32(buffer, this.LinkTrId || 0);

	// Flags
	var flags = 0;

	// First bit is DeleteAfterDeath state
	if (this.DeleteAfterDeath) {
		flags |= 1 << 0;
	}

	// Second bit is DamageThreshold state
	if (this.DamageThreshold) {
		flags |= 1 << 1;
	}

	// TODO: Third bit is used to mark if "Damaged" table is available
	this.writeUInt8(buffer, flags);

	// Country
	this.writeUInt16(buffer, this.Country);

	// DamageReport
	this.writeUInt8(buffer, this.DamageReport);

	// NOTE: Durability in binary file is represented as a 8 bit unsigned integer
	// number where the value is 1 point for every 500 normal durability points.
	this.writeUInt8(buffer, Math.round(this.Durability / 500));

	// Script string table index
	this.writeUInt16(buffer, index.script.stringValue(this.Script));

	// TODO: Damage table data index
	this.writeUInt16(buffer, 0xFFFF);

	return [
		Item.prototype.toBinary.apply(this, arguments),
		buffer
	];
};

module.exports = Block;