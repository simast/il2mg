/** @copyright Simas Toleikis, 2015 */
"use strict";

var fs = require("fs");
var os = require("os");

// Last block index value
var lastIndex = 0;

// Block types
Block.GROUP = "Group";
Block.BLOCK = "Block";
Block.BRIDGE = "Bridge";
Block.DAMAGED = "Damaged";
Block.PLANE = "Plane";
Block.ENTITY = "MCU_TR_Entity";
Block.ICON = "MCU_Icon";
Block.VEHICLE = "Vehicle";
Block.FLAG = "Flag";

// Block position and orientation precision (number of decimal digits)
Block.precisionDigits = 2;

/**
 * Block constructor.
 *
 * @param {string} type Block type.
 */
function Block(type) {

	if (typeof type !== "string" || !type.length) {
		throw new TypeError("Invalid block type value.");
	}

	Object.defineProperty(this, "type", {value: type}); // Block type
	Object.defineProperty(this, "blocks", {value: []}); // Child blocks list
}

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

	position[0] = Number(Number(position[0]).toFixed(Block.precisionDigits));

	if (position[0]) {
		this.XPos = position[0];
	}

	position[1] = Number(Number(position[1]).toFixed(Block.precisionDigits));

	if (position[1]) {
		this.YPos = position[1];
	}

	position[2] = Number(Number(position[2]).toFixed(Block.precisionDigits));

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

	orientation[0] = Number(Number(orientation[0]).toFixed(Block.precisionDigits));

	if (orientation[0]) {
		this.XOri = orientation[0];
	}

	orientation[1] = Number(Number(orientation[1]).toFixed(Block.precisionDigits));

	if (orientation[1]) {
		this.YOri = orientation[1];
	}

	orientation[2] = Number(Number(orientation[2]).toFixed(Block.precisionDigits));

	if (orientation[2]) {
		this.ZOri = orientation[2];
	}
};

/**
 * Set block coalitions.
 *
 * @param {array} coalitions List of coalitions IDs.
 */
Block.prototype.setCoalitions = function(coalitions) {

	if (!Array.isArray(coalitions)) {
		throw new TypeError("Invalid block coalitions value.");
	}

	this.Coalitions = new String(JSON.stringify(coalitions.map(Number)));
};

/**
 * Create a linked block entity.
 */
Block.prototype.createEntity = function() {

	if (this.entity) {
		throw new Error("Block is already linked to an entity.");
	}

	var entity = new Block(Block.ENTITY);

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

	var self = this;
	var indent = new Array(2 * indentLevel + 1).join(" ");
	var value = indent + this.type + os.EOL + indent + "{";

	// Build block properties list
	Object.keys(this).forEach(function(propName) {

		var propValue = self[propName];

		value += os.EOL + indent + "  " + propName;

		var propType = typeof propValue;
		var isArray = false;

		if (propType === "object") {
			isArray = Array.isArray(propValue);
		}

		if (!isArray) {
			value += " = ";
		}

		// Quoted string output
		if (propType === "string" && !(propValue instanceof String)) {
			value += '"' + propValue + '"';
		}
		// Array output
		else if (isArray) {

			value += os.EOL + indent + "  {";

			propValue.forEach(function(item) {
				value += os.EOL + indent + "    " + item + ";";
			});

			value += os.EOL + indent + "  }";
		}
		// Other value output
		else {
			value += propValue;
		}

		if (!isArray) {
			value += ";";
		}
	});

	// Serialize any child blocks
	if (self.blocks.length) {

		indentLevel++;

		self.blocks.forEach(function(block) {
			value += os.EOL + block.toString(indentLevel);
		});
	}

	value += os.EOL + indent + "}";

	// Include linked block entity
	if (this.entity) {
		value += os.EOL + this.entity.toString(indentLevel);
	}

	return value;
};

/**
 * Read a list of blocks from a file.
 *
 * @param {string} file Block file name/path.
 * @returns {array} List of blocks.
 */
Block.readFile = function(file) {

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
		blockStack.push(new Block(blockType));
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
			blockStack[blockStack.length - 1].blocks.push(block);
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

/**
 * Write a list of blocks to a file.
 *
 * @param {string} file Block file name/path.
 * @param {array} blocks List of blocks.
 * @returns {bool} Success/failure status.
 */
Block.writeFile = function(file, blocks) {

	// TODO:
};

module.exports = Block;