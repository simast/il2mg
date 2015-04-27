/** @copyright Simas Toleikis, 2015 */
"use strict";

var numeral = require("numeral");
var data = require("../../src/data");
var Item = require("../../src/item");

module.exports = function(grunt) {

	// Grunt task used to import/convert raw blocks .Group to .json files
	grunt.registerTask("build:blocks", "Build blocks JSON files.", function() {

		var totalBattles = 0;
		var totalItems = 0;

		// Process blocks for each battle
		for (var battleID in data.battles) {

			var battle = data.battles[battleID];
			var blocksPath = "data/battles/" + battleID + "/blocks/";

			// Process all blocks files
			battle.blocks.forEach(function(blockFile) {

				var fileSource = blocksPath + blockFile + ".Group";
				var fileDestination = blocksPath + blockFile + ".json";

				// Read raw blocks
				var blocks = Item.readTextFile(fileSource);

				var json = [];

				// Build output JSON object with recursion
				(function buildJSON(json, blocks) {

					blocks.forEach(function(block) {

						// Only import Block and Bridge type items
						// TODO: Also import block damage (from Damaged child items)
						if (block instanceof Item.Block || block instanceof Item.Bridge) {

							var itemTypeID = data.registerItemType({
								type: block.type,
								script: block.Script,
								model: block.Model
							});

							var jsonItem = [];

							// Item type ID
							jsonItem.push(itemTypeID);

							// Item position
							jsonItem.push(Number(block.XPos.toFixed(Item.PRECISION_POSITION)));
							jsonItem.push(Number(block.YPos.toFixed(Item.PRECISION_POSITION)));
							jsonItem.push(Number(block.ZPos.toFixed(Item.PRECISION_POSITION)));

							// Item orientation
							jsonItem.push(Number(block.YOri.toFixed(Item.PRECISION_ORIENTATION)));

							json.push(jsonItem);

							totalItems++;
						}
						// Process any child blocks
						else if (block instanceof Item.Group && block.items.length) {
							buildJSON(json, block.items);
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

		// Write items type JSON data file
		grunt.file.write(
			"data/items.json",
			JSON.stringify(data.blocks, null, "\t")
		);

		var message = "";

		message += numeral(totalItems).format("0,0") + " ";
		message += grunt.util.pluralize(totalItems, "item/items");
		message += " processed from " + numeral(totalBattles).format("0,0") + " ";
		message += grunt.util.pluralize(totalBattles, "battle/battles") + ".";

		grunt.log.ok(message);
	});
};