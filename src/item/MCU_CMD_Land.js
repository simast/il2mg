/** @copyright Simas Toleikis, 2015 */
"use strict";

var MCU = require("./MCU");

// Land command item
function MCU_CMD_Land() {

	// Call parent constructor
	MCU.apply(this, arguments);
	
	this.Priority = MCU_CMD_Land.PRIORITY_MEDIUM;
}

MCU_CMD_Land.prototype = Object.create(MCU.prototype);
MCU_CMD_Land.prototype.typeID = 16;

// Land command priority constants
MCU_CMD_Land.PRIORITY_LOW = 0;
MCU_CMD_Land.PRIORITY_MEDIUM = 1;
MCU_CMD_Land.PRIORITY_HIGH = 2;

/**
 * Get binary representation of the item.
 *
 * @param {object} index Binary data index object.
 * @returns {Buffer} Binary representation of the item.
 */
MCU_CMD_Land.prototype.toBinary = function(index) {

	var buffer = new Buffer(4);

	// Priority
	this.writeUInt32(buffer, this.Priority);

	return MCU.prototype.toBinary.apply(this, arguments).concat(buffer);
};

module.exports = MCU_CMD_Land;