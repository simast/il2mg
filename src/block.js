/** @copyright Simas Toleikis, 2014 */
"use strict";

var fs = require("fs");
var Lexer = require("lex");

/**
 * Block constructor.
 *
 * @param {string} type Block type.
 */
function Block(type) {
	
	if (typeof type !== "string" || !type.length) {
		throw new TypeError();
	}
	
	// Mark block type
	Object.defineProperty(this, "type", {
		configurable: false,
		enumerable: false,
		writable: false,
		value: type
	});
	
	// Create child blocks list
	Object.defineProperty(this, "blocks", {
		configurable: false,
		enumerable: false,
		writable: false,
		value: []
	});
}

/**
 * Read block (mission) file.
 *
 * @param {string} file Block file name/path.
 * 
 * @returns {array} List of blocks.
 */
Block.readFile = function(file) {

	var fileContent = fs.readFileSync(file, {
		encoding: "ascii" // TODO
	});
	
	if (!fileContent.length) {
		throw new Error("Could not read specified block file (no content).");
	}
	
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
 * Write block (mission) file.
 *
 * @param {string} file Block file name/path.
 * @param {array} blocks List of blocks.
 *
 * @returns {bool} Success/failure status.
 */
Block.writeFile = function(file, blocks) {
	
};

module.exports = Block;