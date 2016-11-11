/** @copyright Simas Toleikis, 2015 */
"use strict";

const MCU = require("./MCU");

// Force complete command item
class MCU_CMD_ForceComplete extends MCU {

	constructor() {
		super();

		this.Priority = MCU_CMD_ForceComplete.PRIORITY_HIGH;
	}

	/**
	 * Get binary representation of the item.
	 *
	 * @param {object} index Binary data index object.
	 * @returns {Buffer} Binary representation of the item.
	 */
	*toBinary(index) {

		yield* super.toBinary(index, 24);

		const buffer = new Buffer(4);

		// Priority
		this.writeUInt32(buffer, this.Priority);

		yield buffer;
	}
}

// Force complete command priority constants
MCU_CMD_ForceComplete.PRIORITY_LOW = 0;
MCU_CMD_ForceComplete.PRIORITY_MEDIUM = 1;
MCU_CMD_ForceComplete.PRIORITY_HIGH = 2;

module.exports = MCU_CMD_ForceComplete;