/** @copyright Simas Toleikis, 2015 */
"use strict";

var Item = require("../item");

// Damaged item
function Damaged() {

}

Damaged.prototype = Object.create(Item.prototype);
Damaged.prototype.hasIndex = false;

module.exports = Damaged;