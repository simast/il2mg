/** @copyright Simas Toleikis, 2015 */
"use strict";

var BlockParent = require("../block");

// Point block
function Point() {

}

Point.prototype = Object.create(BlockParent.prototype);

module.exports = Point;