/** @copyright Simas Toleikis, 2015 */
"use strict";

module.exports = function(grunt) {

	// Grunt task used to import/convert raw airfields .Group to .json files
	grunt.registerTask("build:airfields", "Build airfields JSON files.", function() {

		var numeral = require("numeral");
		var data = require("../../src/data");
		var Block = require("../../src/block");

		var totalBattles = 0;
		var totalAirfields = 0;
		var totalBlocks = 0;

		// Process airfields for each battle
		for (var battleID in data.battles) {

			var battle = data.battles[battleID];
			var airfieldsPath = "data/battles/" + battleID + "/airfields/";

			// Process all airfields
			for (var airfieldID in battle.airfields) {

				var fileSource = airfieldsPath + airfieldID + ".Group";
				var fileDestination = airfieldsPath + airfieldID + ".json";

				// Ignore airfields without .Group file
				if (!grunt.file.exists(fileSource)) {
					continue;
				}

				// Read raw airfield blocks file
				var blocks = Block.readFile(fileSource);

				// Read airfield JSON data file
				var json = grunt.file.readJSON(fileDestination);

				json.blocks = [];

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
							if (!block.XOri && !block.ZOri) {

								// NOTE: Since most blocks only bave one orientation value - we
								// save some space by serializing only the single value.
								jsonBlock.push(block.YOri || 0);
							}
							else {
								jsonBlock.push(block.XOri || 0);
								jsonBlock.push(block.YOri || 0);
								jsonBlock.push(block.ZOri || 0);
							}

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

				totalAirfields++;
			}

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
		okMessage += grunt.util.pluralize(totalBattles, "battle/battles");
		okMessage += " and " + numeral(totalAirfields).format("0,0") + " ";
		okMessage += grunt.util.pluralize(totalAirfields, "airfield/airfields") + ".";

		grunt.log.ok(okMessage);
	});
};