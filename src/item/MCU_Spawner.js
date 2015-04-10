/** @copyright Simas Toleikis, 2015 */
"use strict";

var MCU = require("./MCU");

// Spawner item
function MCU_Spawner() {

	this.SpawnAtMe = 0;
}

MCU_Spawner.prototype = Object.create(MCU.prototype);
MCU_Spawner.prototype.typeID = 48;

/**
 * Get binary representation of the item.
 *
 * @param {object} index Binary data index object.
 * @returns {Buffer} Binary representation of the item.
 */
MCU_Spawner.prototype.toBinary = function(index) {

	var buffer = new Buffer(1);

	// SpawnAtMe
	this.writeUInt8(buffer, this.SpawnAtMe);

	return MCU.prototype.toBinary.apply(this, arguments).concat(buffer);
};

module.exports = MCU_Spawner;