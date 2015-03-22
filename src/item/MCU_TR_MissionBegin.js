/** @copyright Simas Toleikis, 2015 */
"use strict";

var MCU = require("./MCU");

// Mission Begin item
function MCU_TR_MissionBegin() {

}

MCU_TR_MissionBegin.prototype = Object.create(MCU.prototype);
MCU_TR_MissionBegin.prototype.typeID = 28;

module.exports = MCU_TR_MissionBegin;