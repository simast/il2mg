/** @copyright Simas Toleikis, 2015 */
"use strict";

var Block = require("../block");

// Icon block
function MCU_Icon() {

}

MCU_Icon.prototype = new Block();
MCU_Icon.prototype.id = 123;

module.exports = MCU_Icon;