/** @copyright Simas Toleikis, 2015 */
"use strict";

var MCU = require("./MCU");

// Take off command item
function MCU_CMD_TakeOff() {

}

MCU_CMD_TakeOff.prototype = Object.create(MCU.prototype);
MCU_CMD_TakeOff.prototype.typeID = 15;

module.exports = MCU_CMD_TakeOff;