/** @copyright Simas Toleikis, 2015 */
"use strict";

var Block = require("../block");

// Point block
function Point() {

}

Point.prototype = new Block();
Point.prototype.id = 123;

module.exports = Point;