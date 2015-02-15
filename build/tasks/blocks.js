/** @copyright Simas Toleikis, 2015 */
"use strict";

module.exports = function(grunt) {

	// Grunt task used to import/convert raw blocks .Group to .json file
	grunt.registerTask("build:blocks", "Build blocks JSON files.", function() {

		var numeral = require("numeral");
		var DATA = require("../../src/mission").DATA;
		var Block = require("../../src/block");

		var totalBlocks = 0;
		var totalBattles = 0;

		// Process blocks for each battle
		for (var battleID in DATA.battles) {

			var battle = DATA.battles[battleID];
			var blocksPath = "data/battles/" + battleID + "/blocks/";

			// Process all blocks files
			battle.blocks.forEach(function(blockFile) {

				var fileSource = blocksPath + blockFile + ".Group";
				var fileDestination = blocksPath + blockFile + ".json";

				// Read raw blocks
				var blocks = Block.readFile(fileSource);

				var json = {
					types: [],
					models: [],
					scripts: [],
					blocks: []
				};

				// Build output JSON object with recursion
				(function buildJSON(json, blocks) {

					blocks.forEach(function(block) {

						// Only import Block and Bridge type blocks
						// TODO: Also import block damage (from Damaged child blocks)
						if (block.type === Block.BLOCK || block.type === Block.BRIDGE) {

							var jsonBlock = [];

							// Block type
							var typeIndex = json.types.indexOf(block.type);

							if (typeIndex === -1) {
								typeIndex = json.types.push(block.type) - 1;
							}

							jsonBlock.push(typeIndex);

							// Block model
							if (block.Model) {

								var modelIndex = json.models.indexOf(block.Model);

								if (modelIndex === -1) {
									modelIndex = json.models.push(block.Model) - 1;
								}

								jsonBlock.push(modelIndex);
							}

							// Block script
							if (block.Script) {

								var scriptIndex = json.scripts.indexOf(block.Script);

								if (scriptIndex === -1) {
									scriptIndex = json.scripts.push(block.Script) - 1;
								}

								jsonBlock.push(scriptIndex);
							}

							// Block position
							jsonBlock.push(block.XPos || 0);
							jsonBlock.push(block.YPos || 0);
							jsonBlock.push(block.ZPos || 0);

							// Block orientation
							jsonBlock.push(block.XOri || 0);
							jsonBlock.push(block.YOri || 0);
							jsonBlock.push(block.ZOri || 0);

							json.blocks.push(jsonBlock);
							totalBlocks++;
						}

						// Process any child blocks
						if (block.blocks.length) {
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

		var okMessage = "";

		okMessage += numeral(totalBlocks).format("0,0") + " ";
		okMessage += grunt.util.pluralize(totalBlocks, "block/blocks");
		okMessage += " processed from " + totalBattles + " ";
		okMessage += grunt.util.pluralize(totalBattles, "battle/battles") + ".";

		grunt.log.ok(okMessage);
	});
};