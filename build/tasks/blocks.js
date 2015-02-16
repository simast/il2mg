/** @copyright Simas Toleikis, 2015 */
"use strict";

module.exports = function(grunt) {

	// Grunt task used to import/convert raw blocks .Group to .json files
	grunt.registerTask("build:blocks", "Build blocks JSON files.", function() {

		var numeral = require("numeral");
		var data = require("../../src/data");
		var Block = require("../../src/block");

		var totalBattles = 0;
		var totalBlocks = 0;

		// Process blocks for each battle
		for (var battleID in data.battles) {

			var battle = data.battles[battleID];
			var blocksPath = "data/battles/" + battleID + "/blocks/";

			// Process all blocks files
			battle.blocks.forEach(function(blockFile) {

				var fileSource = blocksPath + blockFile + ".Group";
				var fileDestination = blocksPath + blockFile + ".json";

				// Read raw blocks
				var blocks = Block.readFile(fileSource);

				var json = [];

				// Build output JSON object with recursion
				(function buildJSON(json, blocks) {

					blocks.forEach(function(block) {

						// Only import Block and Bridge type blocks
						// TODO: Also import block damage (from Damaged child blocks)
						if (block.type === Block.BLOCK || block.type === Block.BRIDGE) {

							var blockType = data.registerBlock({
								type: block.type,
								script: block.Script,
								model: block.Model
							});

							var jsonBlock = [];

							// Block type
							jsonBlock.push(blockType);

							// Block position
							jsonBlock.push(block.XPos || 0);
							jsonBlock.push(block.YPos || 0);
							jsonBlock.push(block.ZPos || 0);

							// Block orientation
							jsonBlock.push(block.YOri || 0);

							json.push(jsonBlock);

							totalBlocks++;
						}
						// Process any child blocks
						else if (block.type === Block.GROUP && block.blocks.length) {
							buildJSON(json, block.blocks);
						}
					});
				})(json, blocks);

				// Write output JSON blocks file
				grunt.file.write(
					fileDestination,
					JSON.stringify(json, null, "\t")
				);
			});

			totalBattles++;
		}

		// Write blocks type JSON data file
		grunt.file.write(
			"data/blocks.json",
			JSON.stringify(data.blocks, null, "\t")
		);

		var okMessage = "";

		okMessage += numeral(totalBlocks).format("0,0") + " ";
		okMessage += grunt.util.pluralize(totalBlocks, "block/blocks");
		okMessage += " processed from " + numeral(totalBattles).format("0,0") + " ";
		okMessage += grunt.util.pluralize(totalBattles, "battle/battles") + ".";

		grunt.log.ok(okMessage);
	});
};