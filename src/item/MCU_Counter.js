/** @copyright Simas Toleikis, 2015 */
"use strict";

var MCU = require("./MCU");

// Counter item
function MCU_Counter() {

	// Call parent constructor
	MCU.apply(this, arguments);
	
	this.Counter = 1;
	this.Dropcount = 0;
}

MCU_Counter.prototype = Object.create(MCU.prototype);
MCU_Counter.prototype.typeID = 43;

/**
 * Get binary representation of the item.
 *
 * @param {object} index Binary data index object.
 * @returns {Buffer} Binary representation of the item.
 */
MCU_Counter.prototype.toBinary = function(index) {

	var buffer = new Buffer(5);

	// Counter
	this.writeUInt32(buffer, this.Counter);

	// Dropcount
	this.writeUInt8(buffer, this.Dropcount);

	return MCU.prototype.toBinary.apply(this, arguments).concat(buffer);
};

module.exports = MCU_Counter;