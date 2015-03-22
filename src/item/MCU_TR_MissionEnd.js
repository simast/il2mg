/** @copyright Simas Toleikis, 2015 */
"use strict";

var MCU = require("./MCU");

// Mission End item
function MCU_TR_MissionEnd() {

}

MCU_TR_MissionEnd.prototype = Object.create(MCU.prototype);
MCU_TR_MissionEnd.prototype.typeID = 29;

/**
 * Get binary representation of the item.
 *
 * @param {object} index Binary data index object.
 * @returns {Buffer} Binary representation of the item.
 */
MCU_TR_MissionEnd.prototype.toBinary = function(index) {

	var buffer = new Buffer(1);

	// Succeeded
	this.writeUInt8(buffer, this.Succeeded !== undefined ? this.Succeeded : 1);

	return MCU.prototype.toBinary.apply(this, arguments).concat(buffer);
};

module.exports = MCU_TR_MissionEnd;