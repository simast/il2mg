/** @copyright Simas Toleikis, 2015 */
"use strict";

var MCU = require("./MCU");

// Effect command item
function MCU_CMD_Effect() {

	// Call parent constructor
	MCU.apply(this, arguments);

	this.ActionType = MCU_CMD_Effect.ACTION_START;
}

MCU_CMD_Effect.prototype = Object.create(MCU.prototype);
MCU_CMD_Effect.prototype.typeID = 26;

// Effect command action type constants
MCU_CMD_Effect.ACTION_START = 0;
MCU_CMD_Effect.ACTION_STOP = 1;

/**
 * Get binary representation of the item.
 *
 * @param {object} index Binary data index object.
 * @returns {Buffer} Binary representation of the item.
 */
MCU_CMD_Effect.prototype.toBinary = function* (index) {
	
	yield* MCU.prototype.toBinary.apply(this, arguments);

	var buffer = new Buffer(4);

	// ActionType
	this.writeUInt32(buffer, this.ActionType);

	yield buffer;
};

module.exports = MCU_CMD_Effect;