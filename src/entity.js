/** @copyright Simas Toleikis, 2014 */
"use strict";

var os = require("os");

/**
 * Base mission entity constructor.
 *
 * @param {string} name Entity name.
 */
function Entity(name) {

	this._name = name;
}

/**
 * Set entity property.
 *
 * @param {string} key Property key.
 * @param {mixed} value Property value.
 * @param {boolean} isRaw Used to mark string value as raw data (no quotes are added).
 */
Entity.prototype.set = function(key, value, isRaw) {

	if (typeof key !== "string" || !key.length) {
		throw TypeError("Invalid entity property key.");
	}

	if (typeof value === "undefined") {
		throw TypeError("Invalid entity property value.");
	}

	// Initialize entity properties/data
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

// Used to track last unique entity index (ID)
var lastIndex = 0;

/**
 * Set a unique entity index/ID value.
 */
Entity.prototype.setIndex = function() {

	if (this._index) {
		return;
	}

	this._index = ++lastIndex;
	this.set("Index", this._index);
};

/**
 * Set entity position.
 *
 * @param {number} posX Position coordinate X value.
 * @param {number} posY Position coordinate Y value.
 * @param {number} posZ Position coordinate Z value.
 * ... or
 * @param {array} position Position array with x, y and z coordinates.
 */
Entity.prototype.setPosition = function() {

	var position = arguments[0];

	if (!Array.isArray(position)) {
		position = [arguments[0], arguments[1], arguments[2]]
	}

	if (position[0]) {
		this.set("XPos", position[0]);
	}

	if (position[1]) {
		this.set("YPos", position[1]);
	}

	if (position[2]) {
		this.set("ZPos", position[2]);
	}
};

/**
 * Set entity orientation.
 *
 * @param {number} orientX Orientation coordinate X value.
 * @param {number} orientY Orientation coordinate Y value.
 * @param {number} orientZ Orientation coordinate Z value.
 * ... or
 * @param {array} orientation Orientation array with x, y and z coordinates.
 */
Entity.prototype.setOrientation = function() {

	var orientation = arguments[0];

	if (!Array.isArray(orientation)) {
		orientation = [arguments[0], arguments[1], arguments[2]]
	}

	if (orientation[0]) {
		this.set("XOri", orientation[0]);
	}

	if (orientation[1]) {
		this.set("YOri", orientation[1]);
	}

	if (orientation[2]) {
		this.set("ZOri", orientation[2]);
	}
};

/**
 * Set entity coalitions.
 *
 * @param {array} coalitions List of coalitions IDs.
 */
Entity.prototype.setCoalitions = function(coalitions) {

	if (!Array.isArray(coalitions)) {
		throw TypeError("Invalid entity coalitions value.");
	}

	this.set("Coalitions", JSON.stringify(coalitions.map(Number)), true);
};

/**
 * Set entity name.
 *
 * @param {mixed} name Localized (number) or non-localized (string) name.
 */
Entity.prototype.setName = function(name) {

	if (typeof name === "number") {
		this.set("LCName", name);
	}
	else if (typeof name === "string") {
		this.set("Name", name);
	}
	else {
		throw TypeError("Invalid entity name value.");
	}
};

/**
 * Set entity description.
 *
 * @param {mixed} desc Localized (number) or non-localized (string) description.
 */
Entity.prototype.setDescription = function(desc) {

	if (typeof desc === "number") {
		this.set("LCDesc", desc);
	}
	else if (typeof desc === "string") {
		this.set("Desc", desc);
	}
	else {
		throw TypeError("Invalid entity description value.");
	}
};

/**
 * Get string representation of the entity.
 *
 * @returns {string} String representation of the entity.
 */
Entity.prototype.toString = function() {

	var value = this._name + os.EOL + "{";

	if (Array.isArray(this._data)) {

		// Generate entity properties/data
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

module.exports = Entity;