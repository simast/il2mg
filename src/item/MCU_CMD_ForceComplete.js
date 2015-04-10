/** @copyright Simas Toleikis, 2015 */
"use strict";

var MCU = require("./MCU");

// Force complete command item
function MCU_CMD_ForceComplete() {

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
MCU_CMD_ForceComplete.prototype.toBinary = function(index) {

	var buffer = new Buffer(4);

	// Priority
	this.writeUInt32(buffer, this.Priority);

	return MCU.prototype.toBinary.apply(this, arguments).concat(buffer);
};

module.exports = MCU_CMD_ForceComplete;