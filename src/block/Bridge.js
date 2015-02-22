/** @copyright Simas Toleikis, 2015 */
"use strict";

var Block = require("./Block");

// Bridge block
function Bridge() {
	
}

Bridge.prototype = Object.create(Block.prototype);
Bridge.prototype.id = 5;

module.exports = Bridge;