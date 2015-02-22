/** @copyright Simas Toleikis, 2015 */
"use strict";

var BlockParent = require("../block");

// Static block
function Block() {

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

	var buffer = new Buffer(17);

	// Model string table index
	this.writeUInt16(buffer, index.model.stringValue(this.Model));

	// Unknown data table index?
	this.writeUInt16(buffer, 0xFFFF);

	// LinkTrId
	this.writeUInt32(buffer, 0);

	// Flags
	this.writeUInt8(buffer, 0);

	// Country
	this.writeUInt16(buffer, 50);

	// DamageReport
	this.writeUInt8(buffer, 50);

	// Durability
	this.writeUInt8(buffer, 11);

	// Script string table index
	this.writeUInt16(buffer, index.script.stringValue(this.Script));

	// Damage table data index
	this.writeUInt16(buffer, 0xFFFF);

	return [
		BlockParent.prototype.toBinary.apply(this, arguments),
		buffer
	];
};

module.exports = Block;