/** @copyright Simas Toleikis, 2015 */
"use strict";

var Item = require("../item");

// Point item
function Point() {

}

Point.prototype = Object.create(Item.prototype);

module.exports = Point;