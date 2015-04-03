/** @copyright Simas Toleikis, 2015 */
"use strict";

var MCU = require("./MCU");

// Land command item
function MCU_CMD_Land() {

}

MCU_CMD_Land.prototype = Object.create(MCU.prototype);
MCU_CMD_Land.prototype.typeID = 16;

// Land command priority constants
var PRIORITY = MCU_CMD_Land.PRIORITY = {
	LOW: 0,
	MEDIUM: 1,
	HIGH: 2
};

/**
 * Get binary representation of the item.
 *
 * @param {object} index Binary data index object.
 * @returns {Buffer} Binary representation of the item.
 */
MCU_CMD_Land.prototype.toBinary = function(index) {

	var buffer = new Buffer(4);

	// Priority
	this.writeUInt32(buffer, this.Priority !== undefined ? this.Priority : PRIORITY.MEDIUM);

	return MCU.prototype.toBinary.apply(this, arguments).concat(buffer);
};

module.exports = MCU_CMD_Land;