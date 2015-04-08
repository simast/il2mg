/** @copyright Simas Toleikis, 2015 */
"use strict";

var MCU = require("./MCU");

// Delete item
function MCU_Delete() {

}

MCU_Delete.prototype = Object.create(MCU.prototype);
MCU_Delete.prototype.typeID = 50;

module.exports = MCU_Delete;