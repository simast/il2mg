/** @copyright Simas Toleikis, 2015 */
"use strict";

const MCU = require("./MCU");

// Mission Begin item
function MCU_TR_MissionBegin() {

	// Call parent constructor
	MCU.apply(this, arguments);

	this.Enabled = 1;
}

MCU_TR_MissionBegin.prototype = Object.create(MCU.prototype);
MCU_TR_MissionBegin.prototype.typeID = 28;

module.exports = MCU_TR_MissionBegin;