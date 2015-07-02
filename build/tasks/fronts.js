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

				let json = {};

				json.fronts = [];

				// Fronts point data indexes
				let frontsNext = Object.create(null);
				let frontsPrev = Object.create(null);
				
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

						// Process waypoint items (front lines)
						if (item instanceof Item.MCU_Waypoint) {

							// Front line point
							if (/^FRONT/.test(item.Name)) {

								let pointID = item.Index;
								let targetID = item.Targets[0];
								let point = [];

								// Front point position
								point.push(Math.round(item.XPos));
								point.push(Math.round(item.ZPos));

								let segment = null;

								// Link to a known previous point
								if (frontsPrev[pointID]) {

									segment = frontsPrev[pointID].segment;
									segment.push(point);

									let nextTarget = frontsNext[targetID];

									// Merge connecting segments
									while (nextTarget) {

										// Transfer point to connecting segment
										segment.push(nextTarget.segment.shift());

										// Remove an empty (already connected) segment
										if (!nextTarget.segment.length) {
											json.fronts.splice(json.fronts.indexOf(nextTarget.segment), 1);
										}

										// Switch indexed data to new connecting segment
										nextTarget.segment = segment;

										nextTarget = frontsNext[nextTarget.target];
									}
								}
								// Link to a known next point
								else if (targetID && frontsNext[targetID]) {

									segment = frontsNext[targetID].segment;
									segment.unshift(point);
								}
								// Create a new segment
								else {

									segment = [point];
									json.fronts.push(segment);
								}

								// Register front point index data
								frontsNext[pointID] = frontsPrev[targetID] = {
									target: targetID,
									segment: segment
								};
							}
							// Unknown waypoint item definition
							else {
								grunt.fail.fatal("Invalid waypoint definition: " + item.Name);
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