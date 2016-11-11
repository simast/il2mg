/** @copyright Simas Toleikis, 2015 */
"use strict";

const Item = require("../item");

// Ground item
module.exports = class Ground extends Item {

	constructor() {
		super();

		this.DamageThreshold = 1;
		this.DamageReport = Item.DEFAULT_DAMAGE_REPORT;
	}

	/**
	 * Get binary representation of the item.
	 *
	 * @param {object} index Binary data index object.
	 * @returns {Buffer} Binary representation of the item.
	 */
	*toBinary(index) {

		yield* super.toBinary(index, 7);

		const buffer = new Buffer(9);

		// LinkTrId
		this.writeUInt32(buffer, this.LinkTrId || 0);

		// DamageThreshold
		this.writeUInt8(buffer, this.DamageThreshold);

		// DamageReport
		this.writeUInt8(buffer, this.DamageReport);

		// Unknown data
		this.writeUInt8(buffer, 0);
		this.writeUInt8(buffer, 0);
		this.writeUInt8(buffer, 0);

		yield buffer;
	}
};