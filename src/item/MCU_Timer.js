/** @copyright Simas Toleikis, 2015 */
"use strict";

const MCU = require("./MCU");

// Timer item
function MCU_Timer() {

	// Call parent constructor
	MCU.apply(this, arguments);
	
	this.Time = 0;
	this.Random = 100;
}

MCU_Timer.prototype = Object.create(MCU.prototype);
MCU_Timer.prototype.typeID = 41;

/**
 * Get binary representation of the item.
 *
 * @param {object} index Binary data index object.
 * @returns {Buffer} Binary representation of the item.
 */
MCU_Timer.prototype.toBinary = function* (index) {
	
	yield* MCU.prototype.toBinary.apply(this, arguments);

	const buffer = new Buffer(9);

	// Time
	this.writeDouble(buffer, this.Time);

	// Random
	this.writeUInt8(buffer, this.Random);

	yield buffer;
};

module.exports = MCU_Timer;