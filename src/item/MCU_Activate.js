/** @copyright Simas Toleikis, 2015 */
"use strict";

const MCU = require("./MCU");

// Activate item
function MCU_Activate() {

	// Call parent constructor
	MCU.apply(this, arguments);
}

MCU_Activate.prototype = Object.create(MCU.prototype);
MCU_Activate.prototype.typeID = 44;

module.exports = MCU_Activate;