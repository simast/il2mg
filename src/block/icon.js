/** @copyright Simas Toleikis, 2014 */
"use strict";

var Block = require("../block");

/**
 * Create MCU_Icon block.
 *
 * @param {number} iconType Icon type/ID.
 * @param {number} lineType Line type/ID.
 */
function Icon(iconType, lineType) {

	this.set("IconId", iconType);

	if (lineType) {
		this.set("LineType", lineType);
	}
}

// Icon types
Icon.NONE = 0;
Icon.POINT = 901;

Icon.prototype = new Block("MCU_Icon");

module.exports = Icon;