/** @copyright Simas Toleikis, 2015 */
"use strict";

var BlockParent = require("../block");

// Entity block
function MCU_TR_Entity() {

}

MCU_TR_Entity.prototype = Object.create(BlockParent.prototype);
MCU_TR_Entity.prototype.id = 30;

module.exports = MCU_TR_Entity;