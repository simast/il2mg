/** @copyright Simas Toleikis, 2015 */
"use strict";

var MCU = require("./MCU");

// Deactivate item
function MCU_Deactivate() {

	// Call parent constructor
	MCU.apply(this, arguments);
}

MCU_Deactivate.prototype = Object.create(MCU.prototype);
MCU_Deactivate.prototype.typeID = 45;

module.exports = MCU_Deactivate;