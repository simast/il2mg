/** @copyright Simas Toleikis, 2015 */
"use strict";

var MCU = require("./MCU");

// Cover command item
function MCU_CMD_Cover() {

	// Call parent constructor
	MCU.apply(this, arguments);
	
	this.CoverGroup = 1;
	this.Priority = MCU_CMD_Cover.PRIORITY_MEDIUM;
}

MCU_CMD_Cover.prototype = Object.create(MCU.prototype);
MCU_CMD_Cover.prototype.typeID = 25;

// Cover command priority constants
MCU_CMD_Cover.PRIORITY_LOW = 0;
MCU_CMD_Cover.PRIORITY_MEDIUM = 1;
MCU_CMD_Cover.PRIORITY_HIGH = 2;

/**
 * Get binary representation of the item.
 *
 * @param {object} index Binary data index object.
 * @returns {Buffer} Binary representation of the item.
 */
MCU_CMD_Cover.prototype.toBinary = function* (index) {
	
	yield* MCU.prototype.toBinary.apply(this, arguments);

	var buffer = new Buffer(5);

	// CoverGroup
	this.writeUInt8(buffer, this.CoverGroup);
	
	// Priority
	this.writeUInt32(buffer, this.Priority);

	yield buffer;
};

module.exports = MCU_CMD_Cover;