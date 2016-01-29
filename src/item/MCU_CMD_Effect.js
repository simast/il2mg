/** @copyright Simas Toleikis, 2015 */
"use strict";

const MCU = require("./MCU");

// Effect command item
class MCU_CMD_Effect extends MCU {
	
	constructor() {
		super();

		this.ActionType = MCU_CMD_Effect.ACTION_START;
	}
	
	/**
	 * Get binary representation of the item.
	 *
	 * @param {object} index Binary data index object.
	 * @returns {Buffer} Binary representation of the item.
	 */
	*toBinary(index) {
		
		yield* super.toBinary(index, 26);

		const buffer = new Buffer(4);

		// ActionType
		this.writeUInt32(buffer, this.ActionType);

		yield buffer;
	}
}

// Effect command action type constants
MCU_CMD_Effect.ACTION_START = 0;
MCU_CMD_Effect.ACTION_STOP = 1;

module.exports = MCU_CMD_Effect;