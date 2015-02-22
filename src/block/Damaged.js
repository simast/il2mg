/** @copyright Simas Toleikis, 2015 */
"use strict";

var BlockParent = require("../block");

// Damaged block
function Damaged() {

}

Damaged.prototype = Object.create(BlockParent.prototype);

module.exports = Damaged;