/** @copyright Simas Toleikis, 2014 */
"use strict";

var os = require("os");

/**
 * Base mission block constructor.
 *
 * @param {string} name Block name.
 */
function Block(name) {

	this._name = name; // Block name
}

/**
 * Set block property.
 *
 * @param {string} key Property key.
 * @param {mixed} value Property value.
 * @param {boolean} isRaw Used to mark string value as raw data (no quotes are added).
 */
Block.prototype.set = function(key, value, isRaw) {

	if (typeof key !== "string" || !key.length) {
		throw TypeError("Invalid block property key.");
	}

	if (typeof value === "undefined") {
		throw TypeError("Invalid block property value.");
	}

	// Initialize block properties/data
	if (!this._data) {
		this._data = [];
	}

	var data = {
		key: key,
		value: value
	};

	if (isRaw) {
		data.isRaw = true;
	}

	var index = this._data.indexOf(key);

	if (index < 0) {
		index = this._data.push(data) - 1;
	}
	else {
		this._data[index] = data;
	}
};

// Used to track last unique block index/ID
var lastIndex = 0;

/**
 * Set a unique block index/ID value.
 */
Block.prototype.setIndex = function() {

	if (this._index) {
		return;
	}

	this._index = ++lastIndex;
	this.set("Index", this._index);
};

/**
 * Set block position.
 *
 * @param {number} posX Position coordinate X value.
 * @param {number} posY Position coordinate Y value.
 * @param {number} posZ Position coordinate Z value.
 */
Block.prototype.setPosition = function(posX, posY, posZ) {

	if (posX) {
		this.set("XPos", posX);
	}

	if (posZ) {
		this.set("ZPos", posZ);
	}

	if (posY) {
		this.set("YPos", posY);
	}
};

/**
 * Set block orientation.
 *
 * @param {number} orientX Orientation coordinate X value.
 * @param {number} orientY Orientation coordinate Y value.
 * @param {number} orientZ Orientation coordinate Z value.
 */
Block.prototype.setOrientation = function(orientX, orientY, orientZ) {

	if (orientX) {
		this.set("XOri", orientX);
	}

	if (orientY) {
		this.set("YOri", orientY);
	}

	if (orientZ) {
		this.set("ZOri", orientZ);
	}
};

/**
 * Set block coalitions.
 *
 * @param {array} coalitions List of coalitions IDs.
 */
Block.prototype.setCoalitions = function(coalitions) {

	if (!Array.isArray(coalitions)) {
		throw TypeError("Invalid coalitions value.");
	}

	this.set("Coalitions", JSON.stringify(coalitions.map(Number)), true);
};

/**
 * Set block name.
 *
 * @param {number} nameLangID Localized name language ID.
 */
Block.prototype.setName = function(nameLangID) {

	this.set("LCName", nameLangID);
};

/**
 * Set block description.
 *
 * @param {number} descLangID Localized description language ID.
 */
Block.prototype.setDescription = function(descLangID) {

	this.set("LCDesc", descLangID);
};

/**
 * Get string representation of the block.
 *
 * @returns {string} String representation of the block.
 */
Block.prototype.toString = function() {

	var value = this._name + os.EOL + "{";

	if (Array.isArray(this._data)) {

		// Generate block properties/data
		this._data.forEach(function(data) {

			value += os.EOL + "  " + data.key;

			var type = typeof data.value;
			var isArray = false;

			if (type === "object") {
				isArray = Array.isArray(data.value);
			}

			if (!isArray) {
				value += " = ";
			}

			// Quoted string output
			if (!data.isRaw && type === "string") {
				value += '"' + data.value + '"';
			}
			// Array output
			else if (isArray) {

				value += os.EOL + "  {";

				data.value.forEach(function(item) {
					value += os.EOL + "    " + item + ";";
				});

				value += os.EOL + "  }";
			}
			// Other value output
			else {
				value += data.value;
			}

			if (!isArray) {
				value += ";";
			}
		});
	}

	value += os.EOL + "}";

	return value;
};

module.exports = Block;