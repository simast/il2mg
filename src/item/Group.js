/** @copyright Simas Toleikis, 2015 */
"use strict";

var Item = require("../item");

// Group item
function Group() {

}

Group.prototype = Object.create(Item.prototype);
Group.prototype.typeID = 6;
Group.prototype.hasIndex = false;

/**
 * Get binary representation of the item.
 *
 * @param {object} index Binary data index object.
 * @returns {Buffer} Binary representation of the item.
 */
Group.prototype.toBinary = function(index) {

	// Guard against serializing Group items to binary file
	throw new Error("Group item should not be included in the binary file.");
};

module.exports = Group;