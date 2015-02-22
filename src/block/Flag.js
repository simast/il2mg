/** @copyright Simas Toleikis, 2015 */
"use strict";

var BlockParent = require("../block");

// Flag block
function Flag() {

}

Flag.prototype = Object.create(BlockParent.prototype);
Flag.prototype.id = 13;

/**
 * Get binary representation of the block.
 *
 * @param {object} index Binary data index object.
 * @returns {Buffer} Binary representation of the block.
 */
Flag.prototype.toBinary = function(index) {

	var size = 38;
	var scriptLength = Buffer.byteLength(this.Script);

	size += scriptLength;

	var buffer = new Buffer(size);

	// LinkTrId
	this.writeUInt32(buffer, this.LinkTrId || 0);

	// Country
	this.writeUInt16(buffer, this.Country || BlockParent.DEFAULT_COUNTRY);

	// Unknown data
	this.writeUInt16(buffer, 0);

	// StartHeight
	this.writeFloat(buffer, this.StartHeight !== undefined ? this.StartHeight : 1);

	// SpeedFactor
	this.writeFloat(buffer, this.SpeedFactor || 0);

	// BlockThreshold
	this.writeFloat(buffer, this.BlockThreshold || 0);

	// Radius
	this.writeDouble(buffer, this.Radius || 0);

	// Type
	this.writeUInt32(buffer, this.Type || 0);

	// CountPlanes
	this.writeUInt8(buffer, this.CountPlanes || 0);

	// CountVehicles
	this.writeUInt8(buffer, this.CountVehicles || 0);

	// Script
	this.writeString(buffer, scriptLength, this.Script);

	return [
		BlockParent.prototype.toBinary.apply(this, arguments),
		buffer
	];
};

module.exports = Flag;