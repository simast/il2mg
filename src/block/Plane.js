/** @copyright Simas Toleikis, 2015 */
"use strict";

var Block = require("../block");

// Plane block
function Plane() {

}

Plane.prototype = new Block();
Plane.prototype.id = 3;

module.exports = Plane;