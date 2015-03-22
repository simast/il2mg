/** @copyright Simas Toleikis, 2015 */
"use strict";

var MCU = require("./MCU");

// Entity block
function MCU_TR_Entity() {

}

MCU_TR_Entity.prototype = Object.create(MCU.prototype);
MCU_TR_Entity.prototype.typeID = 30;

/**
 * Get binary representation of the item.
 *
 * @param {object} index Binary data index object.
 * @returns {Buffer} Binary representation of the item.
 */
MCU_TR_Entity.prototype.toBinary = function(index) {

	var buffer = new Buffer(12);

	// OnEvents length
	this.writeUInt32(buffer, 0);

	// MisObjID
	this.writeUInt32(buffer, this.MisObjID || 0);

	// Unknown data
	this.writeUInt32(buffer, 0);

	return MCU.prototype.toBinary.apply(this, arguments).concat(buffer);
};

module.exports = MCU_TR_Entity;