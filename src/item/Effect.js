/** @copyright Simas Toleikis, 2015 */
"use strict";

const Item = require("../item");

// Effect item
function Effect() {

}

Effect.prototype = Object.create(Item.prototype);
Effect.prototype.typeID = 10;

/**
 * Get binary representation of the item.
 *
 * @param {object} index Binary data index object.
 * @returns {Buffer} Binary representation of the item.
 */
Effect.prototype.toBinary = function* (index) {
	
	yield* Item.prototype.toBinary.apply(this, arguments);

	let size = 8;
	const scriptLength = Buffer.byteLength(this.Script);

	size += scriptLength;

	const buffer = new Buffer(size);

	// LinkTrId
	this.writeUInt32(buffer, this.LinkTrId || 0);

	// Script
	this.writeString(buffer, scriptLength, this.Script);

	yield buffer;
};

module.exports = Effect;