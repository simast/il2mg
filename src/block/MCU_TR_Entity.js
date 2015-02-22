/** @copyright Simas Toleikis, 2015 */
"use strict";

var BlockParent = require("../block");

// Entity block
function MCU_TR_Entity() {

}

MCU_TR_Entity.prototype = Object.create(BlockParent.prototype);
MCU_TR_Entity.prototype.id = 30;

/**
 * Get binary representation of the block.
 *
 * @param {object} index Binary data index object.
 * @returns {Buffer} Binary representation of the block.
 */
MCU_TR_Entity.prototype.toBinary = function(index) {

	var buffer = new Buffer(21);

	// Enabled
	this.writeUInt8(buffer, this.Enabled !== undefined ? this.Enabled : 1);

	// Unknown data
	this.writeUInt32(buffer, 0);
	this.writeUInt32(buffer, 0);

	// OnEvents length
	this.writeUInt32(buffer, 0);

	// MisObjID
	this.writeUInt32(buffer, this.MisObjID || 0);

	// Unknown data
	this.writeUInt32(buffer, 0);

	return [
		BlockParent.prototype.toBinary.apply(this, arguments),
		buffer
	];
};

module.exports = MCU_TR_Entity;