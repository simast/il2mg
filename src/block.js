/** @copyright Simas Toleikis, 2014 */
"use strict";

var fs = require("fs");
var os = require("os");

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
		throw TypeError("Invalid block name value.");
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
		throw TypeError("Invalid block description value.");
	}
};

/**
 * Set block position.
 *
 * @param {number} posX Position coordinate X value.
 * @param {number} posY Position coordinate Y value.
 * @param {number} posZ Position coordinate Z value.
 * ... or
 * @param {array} position Position array with x, y and z coordinates.
 */
Block.prototype.setPosition = function() {

	var position = arguments[0];

	if (!Array.isArray(position)) {
		position = [arguments[0], arguments[1], arguments[2]]
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
 * @param {number} orientX Orientation coordinate X value.
 * @param {number} orientY Orientation coordinate Y value.
 * @param {number} orientZ Orientation coordinate Z value.
 * ... or
 * @param {array} orientation Orientation array with x, y and z coordinates.
 */
Block.prototype.setOrientation = function() {

	var orientation = arguments[0];

	if (!Array.isArray(orientation)) {
		orientation = [arguments[0], arguments[1], arguments[2]]
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
 * Set block coalitions.
 *
 * @param {array} coalitions List of coalitions IDs.
 */
Block.prototype.setCoalitions = function(coalitions) {

	if (!Array.isArray(coalitions)) {
		throw TypeError("Invalid block coalitions value.");
	}

	this.Coalitions = new String(JSON.stringify(coalitions.map(Number)));
};

/**
 * Get string representation of the block.
 *
 * @returns {string} String representation of the block.
 */
Block.prototype.toString = function() {

	var self = this;
	var value = this.type + os.EOL + "{";
	
	// Build block properties list
	Object.keys(this).forEach(function(propName) {
		
		var propValue = self[propName];
	
		value += os.EOL + "  " + propName;

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

			value += os.EOL + "  {";

			propValue.forEach(function(item) {
				value += os.EOL + "    " + item + ";";
			});

			value += os.EOL + "  }";
		}
		// Other value output
		else {
			value += propValue;
		}

		if (!isArray) {
			value += ";";
		}
	});
	
	value += os.EOL + "}";

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
			propValue = propValue.replace(/^"(.*(?="$))"$/, '$1');
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