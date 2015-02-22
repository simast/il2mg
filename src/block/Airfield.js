/** @copyright Simas Toleikis, 2015 */
"use strict";

var BlockParent = require("../block");

// Airfield block
function Airfield() {

}

Airfield.prototype = Object.create(BlockParent.prototype);

module.exports = Airfield;