/** @copyright Simas Toleikis, 2014 */
"use strict";

// Utility script used to import/convert raw blocks .group to .json file

var fs = require("fs");
var Block = require("../src/block");

var fileSource = "data/battles/stalingrad/raw/blocks.group";
var fileDestination = "data/battles/stalingrad/blocks.json";

// Read raw blocks
var blocks = Block.readFile(fileSource);

var json = {
	models: [],
	scripts: [],
	blocks: []
};

// Build output JSON object with recursion
(function buildJSON(json, blocks, parent) {

	blocks.forEach(function(block) {

		var jsonBlock = {};

		jsonBlock.type = block.type;

		// Block model
		if (block.Model) {

			var modelIndex = json.models.indexOf(block.Model);

			if (modelIndex === -1) {
				modelIndex = json.models.push(block.Model) - 1;
			}

			jsonBlock.model = modelIndex;
		}

		// Block script
		if (block.Script) {

			var scriptIndex = json.scripts.indexOf(block.Script);

			if (scriptIndex === -1) {
				scriptIndex = json.scripts.push(block.Script) - 1;
			}

			jsonBlock.script = scriptIndex;
		}

		// Block durability
		if (typeof block.Durability !== "undefined") {
			jsonBlock.durability = block.Durability;
		}

		// Block position
		if (typeof block.XPos === "number" && typeof block.YPos === "number"  && typeof block.ZPos === "number") {
			jsonBlock.position = [block.XPos, block.YPos, block.ZPos];
		}

		// Block orientation
		if (typeof block.XOri === "number" && typeof block.YOri === "number"  && typeof block.ZOri === "number") {
			jsonBlock.orientation = [block.XOri, block.YOri, block.ZOri];
		}

		parent.push(jsonBlock);

		// Add any child blocks
		if (block.blocks.length) {

			jsonBlock.blocks = [];

			buildJSON(json, block.blocks, jsonBlock.blocks);
		}
	});
})(json, blocks, json.blocks);

// Write output JSON blocks file
fs.writeFileSync(
	fileDestination,
	JSON.stringify(json, null, "\t"),
	{
		encoding: "ascii"
	}
);