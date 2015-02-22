/** @copyright Simas Toleikis, 2015 */
"use strict";

var BlockParent = require("../block");

// Vehicle
function Vehicle() {

}

Vehicle.prototype = Object.create(BlockParent.prototype);
Vehicle.prototype.id = 2;

/**
 * Get binary representation of the block.
 *
 * @param {object} index Binary data index object.
 * @returns {Buffer} Binary representation of the block.
 */
Vehicle.prototype.toBinary = function(index) {

	var size = 39;
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

	// NumberInFormation
	this.writeUInt32(buffer, this.NumberInFormation || 0);

	// Vulnerable
	this.writeUInt8(buffer, this.Vulnerable !== undefined ? this.Vulnerable : 1);

	// Engageable
	this.writeUInt8(buffer, this.Engageable !== undefined ? this.Engageable : 1);

	// LimitAmmo
	this.writeUInt8(buffer, this.LimitAmmo !== undefined ? this.LimitAmmo : 1);

	// Spotter
	this.writeUInt32(buffer, this.Spotter || 0xFFFFFFFF);

	// BeaconChannel
	this.writeUInt32(buffer, this.BeaconChannel || 0);

	// Callsign
	this.writeUInt8(buffer, this.Callsign || 0);

	// DeleteAfterDeath
	this.writeUInt8(buffer, this.DeleteAfterDeath || 0);

	// CoopStart
	this.writeUInt8(buffer, this.CoopStart || 0);

	return [
		BlockParent.prototype.toBinary.apply(this, arguments),
		buffer
	];
};

module.exports = Vehicle;