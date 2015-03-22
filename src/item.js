/** @copyright Simas Toleikis, 2015 */
"use strict";

var fs = require("fs");
var os = require("os");

// Last item index value
var lastIndex = 0;

// Abstract base mission Item class
function Item() {
	throw new Error();
}

// Used to automatically track buffer write cursor
Buffer.prototype._offset = 0;

// Default item data values
Item.DEFAULT_COALITION = 0; // Neutral coalition ID
Item.DEFAULT_COUNTRY = 0; // Neutral country ID
Item.DEFAULT_DAMAGE_REPORT = 50; // 50% of damage
Item.DEFAULT_DURABILITY = 25000;

/**
 * Add a new child item.
 *
 * @param {Item} item Child item object.
 */
Item.prototype.addItem = function(item) {

	if (!(item instanceof Item)) {
		throw new TypeError("Invalid child item value.");
	}

	// Initialize child items list
	if (!this.items) {
		Object.defineProperty(this, "items", {value: []});
	}

	this.items.push(item);
};

/**
 * Set item index (id).
 */
Item.prototype.setIndex = function() {

	if (!this.Index) {
		this.Index = ++lastIndex;
	}
};

/**
 * Set item name.
 *
 * @param {mixed} name Localized (number) or non-localized (string) name.
 */
Item.prototype.setName = function(name) {

	if (typeof name === "number") {
		this.LCName = name;
	}
	else if (typeof name === "string") {
		this.Name = name;
	}
	else {
		throw new TypeError("Invalid item name value.");
	}
};

/**
 * Set item description.
 *
 * @param {mixed} desc Localized (number) or non-localized (string) description.
 */
Item.prototype.setDescription = function(desc) {

	if (typeof desc === "number") {
		this.LCDesc = desc;
	}
	else if (typeof desc === "string") {
		this.Desc = desc;
	}
	else {
		throw new TypeError("Invalid item description value.");
	}
};

/**
 * Set item position.
 *
 * @param {number|array} [...] Position X/Y/Z coordinates as an array or separate arguments.
 */
Item.prototype.setPosition = function() {

	// Array position version: setPosition([X, Y, Z])
	var position = arguments[0];

	if (!Array.isArray(position)) {

		// Short X/Z position version: setPosition(X, Z)
		if (arguments.length === 2) {
			position = [arguments[0], 0, arguments[1]];
		}
		// Argument position version: setPosition(X, Y, Z)
		else {
			position = [arguments[0], arguments[1], arguments[2]];
		}
	}

	if (position[0]) {
		this.XPos = position[0];
	}

	if (position[1]) {
		this.YPos = position[1];
	}

	if (position[2]) {
		this.ZPos = position[2];
	}
};

/**
 * Set item orientation.
 *
 * @param {number|array} [...] Orientation X/Y/Z coordinates as an array or separate arguments.
 */
Item.prototype.setOrientation = function() {

	// Array orientation version: setOrientation([X, Y, Z])
	var orientation = arguments[0];

	if (!Array.isArray(orientation)) {

		// Short Y orientation version: setOrientation(Y)
		if (arguments.length === 1) {
			orientation = [0, arguments[0], 0];
		}
		// Argument orientation version: setOrientation(X, Y, Z)
		else {
			orientation = [arguments[0], arguments[1], arguments[2]];
		}
	}

	if (orientation[0]) {
		this.XOri = orientation[0];
	}

	if (orientation[1]) {
		this.YOri = orientation[1];
	}

	if (orientation[2]) {
		this.ZOri = orientation[2];
	}
};

/**
 * Create a linked item entity.
 *
 * @returns {Item} Linked item entity.
 */
Item.prototype.createEntity = function() {

	if (this.entity) {
		throw new Error("Item is already linked to an entity.");
	}

	var entity = new Item.MCU_TR_Entity();

	this.setIndex();
	entity.setIndex();

	// Link the item with entity
	this.LinkTrId = entity.Index;
	entity.MisObjID = this.Index;

	Object.defineProperty(this, "entity", {value: entity});

	return entity;
};

/**
 * Get string representation of the item.
 *
 * @param {number} indentLevel Indentation level.
 * @returns {string} String representation of the item.
 */
Item.prototype.toString = function(indentLevel) {

	indentLevel = indentLevel || 0;

	var indent = new Array(2 * indentLevel + 1).join(" ");
	var value = indent + this.type + os.EOL + indent + "{";

	// Build item properties list
	Object.keys(this).forEach(function(propName) {

		var propValue = this[propName];

		value += os.EOL + indent + "  " + propName;

		var propType = typeof propValue;
		var isArray = false;
		var isArrayComplex = false;

		if (propType === "object") {

			isArray = Array.isArray(propValue);
			isArrayComplex = isArray && Array.isArray(propValue[0]);
		}

		if (!isArrayComplex) {
			value += " = ";
		}

		// Quoted string output
		if (propType === "string" && !(propValue instanceof String)) {
			value += '"' + propValue + '"';
		}
		// Complex array output
		else if (isArrayComplex) {

			value += os.EOL + indent + "  {";

			propValue.forEach(function(itemValue) {
				value += os.EOL + indent + "    " + itemValue.join(":") + ";";
			});

			value += os.EOL + indent + "  }";
		}
		// Simple array output
		else if (isArray) {
			value += JSON.stringify(propValue);
		}
		// Other value output
		else {
			value += propValue;
		}

		if (!isArrayComplex) {
			value += ";";
		}

	}, this);

	// Serialize any child items
	if (this.items && this.items.length) {

		indentLevel++;

		this.items.forEach(function(item) {
			value += os.EOL + os.EOL + item.toString(indentLevel);
		});
	}

	value += os.EOL + indent + "}";

	// Include linked item entity
	if (this.entity) {
		value += os.EOL + os.EOL + this.entity.toString(indentLevel);
	}

	return value;
};

/**
 * Get base binary representation of the item.
 *
 * @param {object} index Binary data index object.
 * @returns {Buffer} Base binary representation of the item.
 */
Item.prototype.toBinary = function(index) {

	if (!this.typeID) {
		throw new Error("Invalid item binary type ID.");
	}

	// Write base item binary information
	var buffer = new Buffer(46);

	// Item binary type ID
	this.writeUInt32(buffer, this.typeID);

	// Index
	this.writeUInt32(buffer, this.Index || 0);

	// Position
	this.writePosition(buffer);

	// Orientation
	this.writeOrientation(buffer);

	// Name string table index
	this.writeUInt16(buffer, index.name.stringValue(this.Name));

	// Desc string table index
	this.writeUInt16(buffer, index.desc.stringValue(this.Desc));

	// Model string table index
	this.writeUInt16(buffer, index.model.stringValue(this.Model));

	// Skin string table index
	this.writeUInt16(buffer, index.skin.stringValue(this.Skin));

	return buffer;
};

/**
 * Write XPos/YPos/ZPos to the given Buffer object.
 *
 * @param {Buffer} buffer Target buffer object.
 */
Item.prototype.writePosition = function(buffer) {

	// NOTE: Position in binary file is represented as a 64 bit double-precision
	// floating-point value.

	// TODO: Validate position values (take into account mission map size)

	this.writeDouble(buffer, this.XPos || 0);
	this.writeDouble(buffer, this.YPos || 0);
	this.writeDouble(buffer, this.ZPos || 0);
};

/**
 * Write XOri/YOri/ZOri to the given Buffer object.
 *
 * @param {Buffer} buffer Target buffer object.
 */
Item.prototype.writeOrientation = function(buffer) {

	// NOTE: Orientation in binary file is represented as a 16 bit unsigned integer
	// number between 0 (equal to 0 degrees) and 60000 (equal to 360 degrees).
	var degreeValue = 60000 / 360;

	this.writeUInt16(buffer, Math.round(degreeValue * (this.XOri ? this.XOri : 0)));
	this.writeUInt16(buffer, Math.round(degreeValue * (this.YOri ? this.YOri : 0)));
	this.writeUInt16(buffer, Math.round(degreeValue * (this.ZOri ? this.ZOri : 0)));
};

/**
 * Write a string value to the given Buffer object.
 *
 * @param {Buffer} buffer Target buffer object.
 * @param {number} stringLength String value length in bytes.
 * @param {string} stringValue String value to write.
 */
Item.prototype.writeString = function(buffer, stringLength, stringValue) {

	// NOTE: String values are represented in binary files as a length (32 bit
	// unsigned integer) followed by an array of string byte characters.

	// String length
	this.writeUInt32(buffer, stringLength);

	// String value
	if (stringLength > 0) {

		buffer.write(stringValue, buffer._offset, stringLength);
		buffer._offset += stringLength;
	}
};

/**
 * Write a 32 bit unsigned integer value to the given Buffer object.
 *
 * @param {Buffer} buffer Target buffer object.
 * @param {number} numberValue Number value to write.
 */
Item.prototype.writeUInt32 = function(buffer, numberValue) {

	buffer.writeUInt32LE(numberValue, buffer._offset);
	buffer._offset += 4;
};

/**
 * Write a 16 bit unsigned integer value to the given Buffer object.
 *
 * @param {Buffer} buffer Target buffer object.
 * @param {number} numberValue Number value to write.
 */
Item.prototype.writeUInt16 = function(buffer, numberValue) {

	buffer.writeUInt16LE(numberValue, buffer._offset);
	buffer._offset += 2;
};

/**
 * Write a 8 bit unsigned integer value to the given Buffer object.
 *
 * @param {Buffer} buffer Target buffer object.
 * @param {number} numberValue Number value to write.
 */
Item.prototype.writeUInt8 = function(buffer, numberValue) {

	buffer.writeUInt8(numberValue, buffer._offset);
	buffer._offset += 1;
};

/**
 * Write a double-precision floating-point value to the given Buffer object.
 *
 * @param {Buffer} buffer Target buffer object.
 * @param {number} numberValue Number value to write.
 */
Item.prototype.writeDouble = function(buffer, numberValue) {

	buffer.writeDoubleLE(numberValue, buffer._offset);
	buffer._offset += 8;
};

/**
 * Write a single-precision floating-point value to the given Buffer object.
 *
 * @param {Buffer} buffer Target buffer object.
 * @param {number} numberValue Number value to write.
 */
Item.prototype.writeFloat = function(buffer, numberValue) {

	buffer.writeFloatLE(numberValue, buffer._offset);
	buffer._offset += 4;
};

/**
 * Write an array of 32 bit unsigned integer values to the given Buffer object.
 *
 * @param {Buffer} buffer Target buffer object.
 * @param {number} arrayValue Array value to write.
 */
Item.prototype.writeUInt32Array = function(buffer, arrayValue) {

	// Array length
	this.writeUInt32(buffer, arrayValue.length);

	// Array values
	for (var i = 0; i < arrayValue.length; i++) {

		var value = arrayValue[i];

		// Check for valid integer value
		if (!Number.isInteger(value)) {
			throw new Error("Invalid item array value.");
		}

		this.writeUInt32(buffer, value);
	}
};

/**
 * Read a list of items from a text file.
 *
 * @param {string} file Item text file name/path.
 * @returns {array} List of items.
 */
Item.readTextFile = function(file) {

	var fileContent = fs.readFileSync(file, {
		encoding: "ascii" // TODO
	});

	if (!fileContent.length) {
		throw new Error("Could not read specified item file (no content).");
	}

	var Lexer = require("lex");
	var lexer = new Lexer();
	var items = [];
	var itemStack = [];

	// Rule for the start of item definition
	lexer.addRule(/\s*(\w+)\s*{\s*/i, function(matched, itemType) {

		// Add new item to active items stack
		itemStack.push(new Item[itemType]());
	});

	// Rule for item property
	lexer.addRule(/\s*(\w+)\s*=\s*(.+);\s*/i, function(matched, propName, propValue) {

		var item = itemStack[itemStack.length - 1];
		var propNumber = parseFloat(propValue);

		// Value is a number
		if (!isNaN(propNumber)) {
			propValue = propNumber;
		}
		// Value is a string
		else if (propValue[0] === '"') {
			propValue = propValue.replace(/^"(.*(?="$))"$/, "$1");
		}

		// TODO: Handle complex property types (like with the Options item)

		// Add item property
		item[propName] = propValue;
	});

	// Rule for the end of item definition
	lexer.addRule(/\s*}\s*/i, function(matched) {

		var item = itemStack.pop();

		// Root item element
		if (!itemStack.length) {
			items.push(item);
		}
		// Child item element
		else {
			itemStack[itemStack.length - 1].addItem(item);
		}
	});

	lexer.setInput(fileContent);
	lexer.lex();

	// Make sure the stack is empty
	if (itemStack.length) {
		throw new Error();
	}

	return items;
};

module.exports = Item;

// Load all supported mission items
[
	require("./item/Airfield"),
	require("./item/Block"),
	require("./item/Bridge"),
	require("./item/Chart"),
	require("./item/Damaged"),
	require("./item/Flag"),
	require("./item/Group"),
	require("./item/MCU_Icon"),
	require("./item/MCU_Timer"),
	require("./item/MCU_TR_Entity"),
	require("./item/MCU_TR_MissionBegin"),
	require("./item/MCU_TR_MissionEnd"),
	require("./item/MCU_Waypoint"),
	require("./item/Options"),
	require("./item/Plane"),
	require("./item/Point"),
	require("./item/Vehicle")
]
.forEach(function(item) {

	Object.defineProperty(item.prototype, "type", {value: item.name});
	Item[item.name] = item;
});