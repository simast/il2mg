/** @copyright Simas Toleikis, 2015 */
"use strict";

var Block = require("../block");

// Damaged block
function Damaged() {

}

Damaged.prototype = new Block();

module.exports = Damaged;