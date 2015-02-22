/** @copyright Simas Toleikis, 2015 */
"use strict";

var BlockParent = require("../block");

// Plane block
function Plane() {

}

Plane.prototype = Object.create(BlockParent.prototype);
Plane.prototype.id = 3;

module.exports = Plane;