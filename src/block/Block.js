/** @copyright Simas Toleikis, 2015 */
"use strict";

var BlockParent = require("../block");

// Static block
function Block() {

	this.setIndex();
}

Block.prototype = Object.create(BlockParent.prototype);
Block.prototype.id = 1;

/**
 * Get binary representation of the block.
 *
 * @param {object} index Binary data index object.
 * @returns {Buffer} Binary representation of the block.
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

	// Second bit is DamageThreshold state (enabled by default if not specified)
	if (this.DamageThreshold === undefined || this.DamageThreshold) {
		flags |= 1 << 1;
	}

	// TODO: Third bit is used to mark if "Damaged" table is available
	this.writeUInt8(buffer, flags);

	// Country
	this.writeUInt16(buffer, this.Country || BlockParent.DEFAULT_COUNTRY);

	// DamageReport
	var damageReport = BlockParent.DEFAULT_DAMAGE_REPORT;

	if (this.DamageReport !== undefined) {
		damageReport = this.DamageReport;
	}

	this.writeUInt8(buffer, damageReport);

	// Durability
	var durability = BlockParent.DEFAULT_DURABILITY;

	if (this.Durability !== undefined) {
		durability = this.Durability;
	}

	// NOTE: Durability in binary file is represented as a 8 bit unsigned integer
	// number where the value is 1 point for every 500 normal durability points.
	durability = Math.round(durability / 500);

	this.writeUInt8(buffer, durability);

	// Script string table index
	this.writeUInt16(buffer, index.script.stringValue(this.Script));

	// TODO: Damage table data index
	this.writeUInt16(buffer, 0xFFFF);

	return [
		BlockParent.prototype.toBinary.apply(this, arguments),
		buffer
	];
};

module.exports = Block;