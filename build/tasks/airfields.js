/** @copyright Simas Toleikis, 2015 */
"use strict";

module.exports = function(grunt) {

	// Grunt task used to import/convert raw airfields .Group to .json files
	grunt.registerTask("build:airfields", "Build airfields JSON files.", function() {

		var numeral = require("numeral");
		var data = require("../../src/data");
		var Block = require("../../src/block");
		var blockTags = require("../../src/make/airfields").blockTags;

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

				// Blocks file should have a non-empty single Group block
				if (!blocks || !blocks.length || blocks.length !== 1 ||
						blocks[0].type !== Block.GROUP) {

					continue;
				}

				// Read airfield JSON data file
				var json = grunt.file.readJSON(fileDestination);

				json.blocks = [];

				// Build output JSON object with recursion
				(function buildJSON(json, blocks) {

					blocks.forEach(function(block) {

						// Only scan supported block types
						if (block.type === Block.BLOCK || block.type === Block.BRIDGE ||
								block.type === Block.VEHICLE || block.type === Block.FLAG) {

							var blockType = null;
							var blockData = null;

							// Plane spot
							if (/^PLANE/.test(block.Name)) {

								blockType = blockTags.PLANE;

								// TODO: Parse plane spot data
							}
							// Cargo truck
							else if (block.Name === "TRUCK:CARGO") {
								blockType = blockTags.TRUCK_CARGO;
							}
							// Fuel truck
							else if (block.Name === "TRUCK:FUEL") {
								blockType = blockTags.TRUCK_FUEL;
							}
							// Car vehicle
							else if (block.Name === "CAR") {
								blockType = blockTags.CAR;
							}
							// Anti-aircraft position (MG)
							else if (block.Name === "AA:MG") {
								blockType = blockTags.AA_MG;
							}
							// Anti-aircraft position (Flak)
							else if (block.Name === "AA:FLAK") {
								blockType = blockTags.AA_FLAK;
							}
							// Normal block
							else {

								blockType = data.registerBlock({
									type: block.type,
									script: block.Script,
									model: block.Model
								});

								// Decoration block tag
								if (block.Name === "DECO") {
									blockData = blockTags.DECO;
								}
								// Fuel block tag
								else if (block.Name === "FUEL") {
									blockData = blockTags.FUEL;
								}
								// Windsock tag
								else if (block.Name === "WINDSOCK") {
									blockData = blockTags.WINDSOCK;
								}
								// Beacon tag
								else if (block.Name === "BEACON") {
									blockData = blockTags.BEACON;
								}
							}

							var jsonBlock = [];

							// Block type
							jsonBlock.push(blockType);

							// Block position
							jsonBlock.push(block.XPos || 0);
							jsonBlock.push(block.YPos || 0);
							jsonBlock.push(block.ZPos || 0);

							// Block orientation
							jsonBlock.push(block.YOri || 0);

							// Block data
							if (blockData !== null) {
								jsonBlock.push(blockData);
							}

							json.push(jsonBlock);

							totalBlocks++;
						}
						// Process any child blocks
						else if (block.type === Block.GROUP && block.blocks.length) {

							var childBlocks = [];

							json.push(childBlocks);

							buildJSON(childBlocks, block.blocks);
						}
					});
				})(json.blocks, blocks[0].blocks);

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