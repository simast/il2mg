/** @copyright Simas Toleikis, 2015 */
"use strict";

var Item = require("../item");

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
Effect.prototype.toBinary = function(index) {

	var size = 8;
	var scriptLength = Buffer.byteLength(this.Script);

	size += scriptLength;

	var buffer = new Buffer(size);

	// LinkTrId
	this.writeUInt32(buffer, this.LinkTrId || 0);

	// Script
	this.writeString(buffer, scriptLength, this.Script);

	return [
		Item.prototype.toBinary.apply(this, arguments),
		buffer
	];
};

module.exports = Effect;