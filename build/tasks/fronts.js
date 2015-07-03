/** @copyright Simas Toleikis, 2015 */
"use strict";

// Load static global data
require("../../src/data");

let numeral = require("numeral");
let Item = require("../../src/item");

module.exports = function(grunt) {

	// Grunt task used to import/convert raw front .Group to .json files
	grunt.registerTask("build:fronts", "Build fronts JSON files.", function() {

		let totalBattles = 0;
		let totalItems = 0;

		// Process fronts for each battle
		for (let battleID in DATA.battles) {

			let battle = DATA.battles[battleID];
			let frontsPath = "data/battles/" + battleID + "/fronts/";

			// Process all fronts
			for (let frontDate in battle.fronts) {

				let frontFile = battle.fronts[frontDate];
				let fileSource = frontsPath + frontFile + ".Group";
				let fileDestination = frontsPath + frontFile + ".json";

				// Read raw fronts Group text file
				let items = Item.readTextFile(fileSource);

				// Group file should have a non-empty single Group item
				if (!items || !items.length || items.length !== 1 ||
						!(items[0] instanceof Item.Group)) {

					continue;
				}

				let json = [];

				// Fronts point data indexes
				let pointsNext = Object.create(null);
				let pointsPrev = Object.create(null);
				
				// Build output JSON object with recursion
				(function buildJSON(items) {

					items.forEach(function(item) {

						// Process group child items
						if (item instanceof Item.Group) {

							if (item.items.length) {
								buildJSON(item.items);
							}

							return;
						}

						// All front line items are waypoints
						if (item instanceof Item.MCU_Waypoint) {

							// Process supported front line item
							if (DATA.frontLine[item.Name]) {

								let point = [];
								let pointID = item.Index;
								
								// NOTE: Multiple target links are not supported
								let targetID = item.Targets[0];
								
								// Point item type
								point.push(DATA.frontLine[item.Name]);

								// Point item position
								point.push(Math.round(item.XPos));
								point.push(Math.round(item.ZPos));

								let segment = null;

								// Link to a known previous point
								if (pointsPrev[pointID]) {

									segment = pointsPrev[pointID].segment;
									segment.push(point);

									let nextTarget = pointsNext[targetID];

									// Merge connecting segments
									while (nextTarget) {

										// Line is a loop
										if (nextTarget.segment === segment) {

											segment.push(true);
											break;
										}

										// Transfer point to connecting segment
										segment.push(nextTarget.segment.shift());

										// Remove an empty (already connected) segment
										if (!nextTarget.segment.length) {
											json.splice(json.indexOf(nextTarget.segment), 1);
										}

										// Switch indexed data to new connecting segment
										nextTarget.segment = segment;

										nextTarget = pointsNext[nextTarget.target];
									}
								}
								// Link to a known next point
								else if (targetID && pointsNext[targetID]) {

									segment = pointsNext[targetID].segment;
									segment.unshift(point);
								}
								// Create a new segment
								else {

									segment = [point];
									json.push(segment);
								}

								// Register front point index data
								pointsNext[pointID] = pointsPrev[targetID] = {
									target: targetID,
									segment: segment
								};
							}
							// Unknown front point item definition
							else {
								grunt.fail.fatal("Invalid front point definition: " + item.Name);
							}

							totalItems++;
						}
					});
				})(items[0].items);
				
				// Write output JSON fronts file
				grunt.file.write(
					fileDestination,
					JSON.stringify(json, null, "\t")
				);
			}

			totalBattles++;
		}

		let message = "";

		message += numeral(totalItems).format("0,0") + " ";
		message += grunt.util.pluralize(totalItems, "item/items");
		message += " processed from " + numeral(totalBattles).format("0,0") + " ";
		message += grunt.util.pluralize(totalBattles, "battle/battles") + ".";

		grunt.log.ok(message);
	});
};