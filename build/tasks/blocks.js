/** @copyright Simas Toleikis, 2015 */
"use strict";

module.exports = function(grunt) {

	// Grunt task used to import/convert raw blocks .Group to .json files
	grunt.registerTask("build:blocks", "Build blocks JSON files.", function() {

		var numeral = require("numeral");
		var data = require("../../src/data");
		var Item = require("../../src/item");

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
							jsonItem.push(block.XPos || 0);
							jsonItem.push(block.ZPos || 0);

							// Item orientation
							jsonItem.push(block.YOri || 0);

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

		var okMessage = "";

		okMessage += numeral(totalItems).format("0,0") + " ";
		okMessage += grunt.util.pluralize(totalItems, "item/items");
		okMessage += " processed from " + numeral(totalBattles).format("0,0") + " ";
		okMessage += grunt.util.pluralize(totalBattles, "battle/battles") + ".";

		grunt.log.ok(okMessage);
	});
};