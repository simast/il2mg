/** @copyright Simas Toleikis, 2015 */
"use strict";

var BlockParent = require("../block");

// Plane block
function Plane() {

}

Plane.prototype = Object.create(BlockParent.prototype);
Plane.prototype.id = 3;

/**
 * Get binary representation of the block.
 *
 * @param {object} index Binary data index object.
 * @returns {Buffer} Binary representation of the block.
 */
Plane.prototype.toBinary = function(index) {

	var size = 50;
	var scriptLength = Buffer.byteLength(this.Script);

	size += scriptLength;

	var buffer = new Buffer(size);

	// LinkTrId
	this.writeUInt32(buffer, this.LinkTrId || 0);

	// DamageThreshold
	this.writeUInt8(buffer, this.DamageThreshold !== undefined ? this.DamageThreshold : 1);

	// DamageReport
	var damageReport = BlockParent.DEFAULT_DAMAGE_REPORT;

	if (this.DamageReport !== undefined) {
		damageReport = this.DamageReport;
	}

	this.writeUInt8(buffer, damageReport);

	// Unknown data
	this.writeUInt8(buffer, 0);
	this.writeUInt8(buffer, 0);
	this.writeUInt8(buffer, 0);

	// Script
	this.writeString(buffer, scriptLength, this.Script);

	// Country
	this.writeUInt16(buffer, this.Country || BlockParent.DEFAULT_COUNTRY);

	// Unknown data
	this.writeUInt16(buffer, 0);

	// AILevel
	this.writeUInt32(buffer, this.AILevel !== undefined ? this.AILevel : 2);

	// CoopStart
	this.writeUInt8(buffer, this.CoopStart || 0);

	// StartInAir
	this.writeUInt8(buffer, this.StartInAir);

	// Callsign
	this.writeUInt8(buffer, this.Callsign || 0);

	// Callnum
	this.writeUInt8(buffer, this.Callnum || 0);

	// Unknown data
	this.writeUInt32(buffer, 0);

	// Time
	this.writeUInt32(buffer, this.Time || 60);

	// Vulnerable
	this.writeUInt8(buffer, this.Vulnerable !== undefined ? this.Vulnerable : 1);

	// Engageable
	this.writeUInt8(buffer, this.Engageable !== undefined ? this.Engageable : 1);

	// LimitAmmo
	this.writeUInt8(buffer, this.LimitAmmo !== undefined ? this.LimitAmmo : 1);

	// PayloadId
	this.writeUInt32(buffer, this.PayloadId);

	// WMMask
	this.writeUInt32(buffer, this.WMMask);

	// AiRTBDecision
	this.writeUInt8(buffer, this.AiRTBDecision !== undefined ? this.AiRTBDecision : 1);

	// DeleteAfterDeath
	this.writeUInt8(buffer, this.DeleteAfterDeath || 0);

	// Fuel
	this.writeFloat(buffer, this.Fuel !== undefined ? this.Fuel : 1);

	return [
		BlockParent.prototype.toBinary.apply(this, arguments),
		buffer
	];
};

module.exports = Plane;