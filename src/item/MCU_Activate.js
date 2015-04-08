/** @copyright Simas Toleikis, 2015 */
"use strict";

var MCU = require("./MCU");

// Activate item
function MCU_Activate() {

}

MCU_Activate.prototype = Object.create(MCU.prototype);
MCU_Activate.prototype.typeID = 44;

module.exports = MCU_Activate;