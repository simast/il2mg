/** @copyright Simas Toleikis, 2015 */
"use strict";

var BlockParent = require("../block");

// Group block
function Group() {

}

Group.prototype = Object.create(BlockParent.prototype);
Group.prototype.id = 6;

/**
 * Get binary representation of the block.
 *
 * @param {object} index Binary data index object.
 * @returns {Buffer} Binary representation of the block.
 */
Group.prototype.toBinary = function(index) {

	// Guard against serializing Group blocks to binary file
	throw new Error("Group block should not be included in the binary file.");
};

module.exports = Group;