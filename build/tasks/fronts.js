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
			let frontsProcessed = Object.create(null);

			// Process all fronts
			for (let frontDate in battle.fronts) {

				let frontFile = battle.fronts[frontDate];
				
				// Skip file if it was already processed for another front date
				if (frontsProcessed[frontFile]) {
					continue;
				}
				
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

				// Front point data index
				let pointsIndex = Object.create(null);
				
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
								let pointIndex = item.Index;
								let pointTargets = [];
								let pointID = json.push(point) - 1;

								// Point item type
								point.push(DATA.frontLine[item.Name]);

								// Point item position
								point.push(Math.round(item.XPos));
								point.push(Math.round(item.ZPos));

								// Mark target list index position
								let targetIndexPos = point.length;

								// Process item targets
								for (let targetIndex of item.Targets) {

									// Target point is already processed
									if (typeof pointsIndex[targetIndex] === "number") {
										pointTargets.push(pointsIndex[targetIndex]);
									}
									// Target point is pending
									else {

										pointsIndex[targetIndex] = pointsIndex[targetIndex] || [];
										pointsIndex[targetIndex].push(pointID);
									}
								}

								// Process pending targets
								if (pointsIndex[pointIndex]) {
									
									while (pointsIndex[pointIndex].length) {

										let targetID = pointsIndex[pointIndex].shift();
										let targetList = json[targetID][targetIndexPos];
										
										// Create a new target list
										if (!targetList) {
											targetList = json[targetID][targetIndexPos] = [];
										}
										
										targetList.push(pointID);
									}
								}
								
								// Point item targets
								if (pointTargets.length) {
									point.push(pointTargets);
								}
								
								// Mark point as processed
								pointsIndex[pointIndex] = pointID;
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
				
				// Mark front file as processed
				frontsProcessed[frontFile] = true;
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