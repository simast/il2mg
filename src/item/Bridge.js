/** @copyright Simas Toleikis, 2015 */
"use strict";

const Block = require("./Block");

// Bridge item
function Bridge() {

	// Call parent constructor
	Block.apply(this, arguments);
}

Bridge.prototype = Object.create(Block.prototype);
Bridge.prototype.typeID = 5;

module.exports = Bridge;