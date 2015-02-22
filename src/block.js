/** @copyright Simas Toleikis, 2015 */
"use strict";

var fs = require("fs");
var os = require("os");

// Last block index value
var lastIndex = 0;

// Abstract base Block class
function Block() {
	throw new Error();
}

// Used for auto buffer write cursor tracking
Buffer.prototype._offset = 0;

/**
 * Add a new child block.
 *
 * @param {Block} block Child block object.
 */
Block.prototype.addBlock = function(block) {

	if (!(block instanceof Block)) {
		throw new TypeError("Invalid child block value.");
	}

	// Initialize child blocks list
	if (!this.blocks) {
		Object.defineProperty(this, "blocks", {value: []});
	}

	this.blocks.push(block);
};

/**
 * Set block index (id).
 */
Block.prototype.setIndex = function() {

	if (!this.Index) {
		this.Index = ++lastIndex;
	}
};

/**
 * Set block name.
 *
 * @param {mixed} name Localized (number) or non-localized (string) name.
 */
Block.prototype.setName = function(name) {

	if (typeof name === "number") {
		this.LCName = name;
	}
	else if (typeof name === "string") {
		this.Name = name;
	}
	else {
		throw new TypeError("Invalid block name value.");
	}
};

/**
 * Set block description.
 *
 * @param {mixed} desc Localized (number) or non-localized (string) description.
 */
Block.prototype.setDescription = function(desc) {

	if (typeof desc === "number") {
		this.LCDesc = desc;
	}
	else if (typeof desc === "string") {
		this.Desc = desc;
	}
	else {
		throw new TypeError("Invalid block description value.");
	}
};

/**
 * Set block position.
 *
 * @param {number|array} [...] Position X/Y/Z coordinates as an array or separate arguments.
 */
Block.prototype.setPosition = function() {

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
 * Set block orientation.
 *
 * @param {number|array} [...] Orientation X/Y/Z coordinates as an array or separate arguments.
 */
Block.prototype.setOrientation = function() {

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
 * Create a linked block entity.
 */
Block.prototype.createEntity = function() {

	if (this.entity) {
		throw new Error("Block is already linked to an entity.");
	}

	var entity = new Block.MCU_TR_Entity();

	this.setIndex();
	entity.setIndex();

	// Link the block with entity
	this.LinkTrId = entity.Index;
	entity.MisObjID = this.Index;

	Object.defineProperty(this, "entity", {value: entity});
};

/**
 * Get string representation of the block.
 *
 * @param {number} indentLevel Indentation level.
 * @returns {string} String representation of the block.
 */
Block.prototype.toString = function(indentLevel) {

	indentLevel = indentLevel || 0;

	var indent = new Array(2 * indentLevel + 1).join(" ");
	var value = indent + this.type + os.EOL + indent + "{";

	// Build block properties list
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

	// Serialize any child blocks
	if (this.blocks && this.blocks.length) {

		indentLevel++;

		this.blocks.forEach(function(block) {
			value += os.EOL + os.EOL + block.toString(indentLevel);
		});
	}

	value += os.EOL + indent + "}";

	// Include linked block entity
	if (this.entity) {
		value += os.EOL + os.EOL + this.entity.toString(indentLevel);
	}

	return value;
};

/**
 * Get base binary representation of the block.
 *
 * @param {object} index Binary data index object.
 * @returns {Buffer} Base binary representation of the block.
 */
Block.prototype.toBinary = function(index) {

	if (!this.id) {
		throw new Error("Invalid block binary type ID.");
	}

	// Write base block binary information
	var buffer = new Buffer(42);

	// Block ID
	this.writeUInt32(buffer, this.id);

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

	return buffer;
};

/**
 * Write XPos/YPos/ZPos to the given Buffer object.
 *
 * @param {Buffer} buffer Target buffer object.
 */
Block.prototype.writePosition = function(buffer) {

	this.writeDouble(buffer, this.XPos || 0);
	this.writeDouble(buffer, this.YPos || 0);
	this.writeDouble(buffer, this.ZPos || 0);
};

/**
 * Write XOri/YOri/ZOri to the given Buffer object.
 *
 * @param {Buffer} buffer Target buffer object.
 */
Block.prototype.writeOrientation = function(buffer) {

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
Block.prototype.writeString = function(buffer, stringLength, stringValue) {

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
Block.prototype.writeUInt32 = function(buffer, numberValue) {

	buffer.writeUInt32LE(numberValue, buffer._offset);
	buffer._offset += 4;
};

/**
 * Write a 16 bit unsigned integer value to the given Buffer object.
 *
 * @param {Buffer} buffer Target buffer object.
 * @param {number} numberValue Number value to write.
 */
Block.prototype.writeUInt16 = function(buffer, numberValue) {

	buffer.writeUInt16LE(numberValue, buffer._offset);
	buffer._offset += 2;
};

/**
 * Write a 8 bit unsigned integer value to the given Buffer object.
 *
 * @param {Buffer} buffer Target buffer object.
 * @param {number} numberValue Number value to write.
 */
Block.prototype.writeUInt8 = function(buffer, numberValue) {

	buffer.writeUInt8(numberValue, buffer._offset);
	buffer._offset += 1;
};

/**
 * Write a double-precision floating-point value to the given Buffer object.
 *
 * @param {Buffer} buffer Target buffer object.
 * @param {number} numberValue Number value to write.
 */
Block.prototype.writeDouble = function(buffer, numberValue) {

	buffer.writeDoubleLE(numberValue, buffer._offset);
	buffer._offset += 8;
};

/**
 * Write a single-precision floating-point value to the given Buffer object.
 *
 * @param {Buffer} buffer Target buffer object.
 * @param {number} numberValue Number value to write.
 */
Block.prototype.writeFloat = function(buffer, numberValue) {

	buffer.writeFloatLE(numberValue, buffer._offset);
	buffer._offset += 4;
};

/**
 * Write an array of 32 bit unsigned integer values to the given Buffer object.
 *
 * @param {Buffer} buffer Target buffer object.
 * @param {number} arrayValue Array value to write.
 */
Block.prototype.writeUInt32Array = function(buffer, arrayValue) {

	// Array length
	this.writeUInt32(buffer, arrayValue.length);

	// Array values
	for (var i = 0; i < arrayValue.length; i++) {

		var value = arrayValue[i];

		// Check for valid integer value
		if (Number(value) !== value || value % 1 !== 0) {
			throw new Error("Invalid block array value.");
		}

		this.writeUInt32(buffer, value);
	}
};

/**
 * Read a list of blocks from a text file.
 *
 * @param {string} file Block text file name/path.
 * @returns {array} List of blocks.
 */
Block.readTextFile = function(file) {

	var fileContent = fs.readFileSync(file, {
		encoding: "ascii" // TODO
	});

	if (!fileContent.length) {
		throw new Error("Could not read specified block file (no content).");
	}

	var Lexer = require("lex");
	var lexer = new Lexer();
	var blocks = [];
	var blockStack = [];

	// Rule for the start of block definition
	lexer.addRule(/\s*(\w+)\s*{\s*/i, function(matched, blockType) {

		// Add new block to active blocks stack
		blockStack.push(new Block[blockType]());
	});

	// Rule for block property
	lexer.addRule(/\s*(\w+)\s*=\s*(.+);\s*/i, function(matched, propName, propValue) {

		var block = blockStack[blockStack.length - 1];
		var propNumber = parseFloat(propValue);

		// Value is a number
		if (!isNaN(propNumber)) {
			propValue = propNumber;
		}
		// Value is a string
		else if (propValue[0] === '"') {
			propValue = propValue.replace(/^"(.*(?="$))"$/, "$1");
		}

		// TODO: Handle complex property types (like with the Options block)

		// Add block property
		block[propName] = propValue;
	});

	// Rule for the end of block definition
	lexer.addRule(/\s*}\s*/i, function(matched) {

		var block = blockStack.pop();

		// Root block element
		if (!blockStack.length) {
			blocks.push(block);
		}
		// Child block element
		else {
			blockStack[blockStack.length - 1].addBlock(block);
		}
	});

	lexer.setInput(fileContent);
	lexer.lex();

	// Make sure the stack is empty
	if (blockStack.length) {
		throw new Error();
	}

	return blocks;
};

module.exports = Block;

// Load all supported blocks
[
	require("./block/Airfield"),
	require("./block/Block"),
	require("./block/Bridge"),
	require("./block/Chart"),
	require("./block/Damaged"),
	require("./block/Flag"),
	require("./block/Group"),
	require("./block/MCU_Icon"),
	require("./block/MCU_TR_Entity"),
	require("./block/Options"),
	require("./block/Plane"),
	require("./block/Point"),
	require("./block/Vehicle")
]
.forEach(function(block) {

	Object.defineProperty(block.prototype, "type", {value: block.name});
	Block[block.name] = block;
});