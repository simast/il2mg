/** @copyright Simas Toleikis, 2015 */
"use strict";

const MCU = require("./MCU");

// Force complete command item
function MCU_CMD_ForceComplete() {

	// Call parent constructor
	MCU.apply(this, arguments);
	
	this.Priority = MCU_CMD_ForceComplete.PRIORITY_HIGH;
}

MCU_CMD_ForceComplete.prototype = Object.create(MCU.prototype);
MCU_CMD_ForceComplete.prototype.typeID = 24;

// Force complete command priority constants
MCU_CMD_ForceComplete.PRIORITY_LOW = 0;
MCU_CMD_ForceComplete.PRIORITY_MEDIUM = 1;
MCU_CMD_ForceComplete.PRIORITY_HIGH = 2;

/**
 * Get binary representation of the item.
 *
 * @param {object} index Binary data index object.
 * @returns {Buffer} Binary representation of the item.
 */
MCU_CMD_ForceComplete.prototype.toBinary = function* (index) {
	
	yield* MCU.prototype.toBinary.apply(this, arguments);

	const buffer = new Buffer(4);

	// Priority
	this.writeUInt32(buffer, this.Priority);

	yield buffer;
};

module.exports = MCU_CMD_ForceComplete;