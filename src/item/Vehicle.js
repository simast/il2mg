/** @copyright Simas Toleikis, 2015 */
"use strict";

var Item = require("../item");

// Vehicle
function Vehicle() {

	this.DamageThreshold = 1;
	this.DamageReport = Item.DEFAULT_DAMAGE_REPORT;
	this.Country = Item.DEFAULT_COUNTRY;
	this.AILevel = Vehicle.AI_NORMAL;
	this.NumberInFormation = 0;
	this.Vulnerable = 1;
	this.Engageable = 1;
	this.LimitAmmo = 1;
	this.Spotter = -1;
	this.BeaconChannel = 0;
	this.Callsign = 0;
	this.DeleteAfterDeath = 1;
	this.CoopStart = 0;
}

Vehicle.prototype = Object.create(Item.prototype);
Vehicle.prototype.typeID = 2;

// Vehicle AI level constants
Vehicle.AI_PLAYER = 0;
Vehicle.AI_LOW = 1;
Vehicle.AI_NORMAL = 2;
Vehicle.AI_HIGH = 3;

/**
 * Get binary representation of the item.
 *
 * @param {object} index Binary data index object.
 * @returns {Buffer} Binary representation of the item.
 */
Vehicle.prototype.toBinary = function* (index) {

	yield* Item.prototype.toBinary.apply(this, arguments);

	var size = 39;
	var scriptLength = Buffer.byteLength(this.Script);

	size += scriptLength;

	var buffer = new Buffer(size);

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

	// Script
	this.writeString(buffer, scriptLength, this.Script);

	// Country
	this.writeUInt16(buffer, this.Country);

	// Unknown data
	this.writeUInt16(buffer, 0);

	// AILevel
	this.writeUInt32(buffer, this.AILevel);

	// NumberInFormation
	this.writeUInt32(buffer, this.NumberInFormation);

	// Vulnerable
	this.writeUInt8(buffer, this.Vulnerable);

	// Engageable
	this.writeUInt8(buffer, this.Engageable);

	// LimitAmmo
	this.writeUInt8(buffer, this.LimitAmmo);

	// Spotter
	this.writeUInt32(buffer, this.Spotter >= 0 ? this.Spotter : 0xFFFFFFFF);

	// BeaconChannel
	this.writeUInt32(buffer, this.BeaconChannel);

	// Callsign
	this.writeUInt8(buffer, this.Callsign);

	// DeleteAfterDeath
	this.writeUInt8(buffer, this.DeleteAfterDeath);

	// CoopStart
	this.writeUInt8(buffer, this.CoopStart);

	yield buffer;
};

module.exports = Vehicle;