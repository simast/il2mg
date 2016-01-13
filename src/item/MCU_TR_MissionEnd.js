/** @copyright Simas Toleikis, 2015 */
"use strict";

const MCU = require("./MCU");

// Mission End item
function MCU_TR_MissionEnd() {

	// Call parent constructor
	MCU.apply(this, arguments);

	this.Enabled = 1;
	this.Succeeded = 1;
}

MCU_TR_MissionEnd.prototype = Object.create(MCU.prototype);
MCU_TR_MissionEnd.prototype.typeID = 29;

/**
 * Get binary representation of the item.
 *
 * @param {object} index Binary data index object.
 * @returns {Buffer} Binary representation of the item.
 */
MCU_TR_MissionEnd.prototype.toBinary = function* (index) {
	
	yield* MCU.prototype.toBinary.apply(this, arguments);

	const buffer = new Buffer(1);

	// Succeeded
	this.writeUInt8(buffer, this.Succeeded);

	yield buffer;
};

module.exports = MCU_TR_MissionEnd;