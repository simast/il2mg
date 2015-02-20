/** @copyright Simas Toleikis, 2015 */
"use strict";

var Block = require("../block");

// Airfield block
function Airfield() {

}

Airfield.prototype = new Block();
Airfield.prototype.id = 123;

module.exports = Airfield;