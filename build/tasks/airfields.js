/** @copyright Simas Toleikis, 2015 */
"use strict";

module.exports = function(grunt) {

	// Grunt task used to import/convert raw airfields .Group to .json files
	grunt.registerTask("build:airfields", "Build airfields JSON files.", function() {

		var numeral = require("numeral");
		var data = require("../../src/data");
		var Item = require("../../src/item");
		var makeAirfields = require("../../src/make/airfields");
		var itemTags = makeAirfields.itemTags;
		var planeSize = makeAirfields.planeSize;

		var totalBattles = 0;
		var totalAirfields = 0;
		var totalItems = 0;

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

				// Read raw airfield Group text file
				var items = Item.readTextFile(fileSource);

				// Group file should have a non-empty single Group item
				if (!items || !items.length || items.length !== 1 ||
						!(items[0] instanceof Item.Group)) {

					continue;
				}

				// Read airfield JSON data file
				var json = grunt.file.readJSON(fileDestination);

				json.items = [];
				json.sectors = {};

				// Build output JSON object with recursion
				(function buildJSON(jsonItems, items) {

					items.forEach(function(item) {

						// Only scan supported item types
						if (item instanceof Item.Block || item instanceof Item.Bridge ||
								item instanceof Item.Vehicle || item instanceof Item.Flag) {

							var itemTypeID = null;
							var itemData = [];
							var itemTypeData = {
								type: item.type,
								script: item.Script,
								model: item.Model
							};

							// Plane spot
							if (/^PLANE/.test(item.Name)) {

								itemTypeID = itemTags.PLANE;

								var planeData = item.Name.split(":");
								var planeDataIndex = 1;

								// Plane sector number
								var planeSector = +planeData[planeDataIndex++];

								if (!Number.isInteger(planeSector)) {
									grunt.fail.fatal("Invalid plane sector in PLANE definition: " + planeSector);
								}

								itemData.push(planeSector);

								// Plane taxi route number
								var planeTaxiRoute = +planeData[planeDataIndex++];

								if (!Number.isInteger(planeTaxiRoute)) {

									planeTaxiRoute = false;
									planeDataIndex--;
								}

								itemData.push(planeTaxiRoute);

								// Plane size
								var planeSizeType = planeData[planeDataIndex++];
								var planeSizeID = planeSize[planeSizeType];

								if (!Number.isInteger(planeSizeID)) {
									grunt.fail.fatal("Invalid plane size in PLANE definition: " + planeSizeType);
								}

								itemData.push(planeSizeID);

								// Camo plane flag
								var planeFlag = planeData[planeDataIndex++];

								if (planeFlag === "CAMO") {
									itemData.push(1);
								}
								else if (planeFlag !== undefined) {
									grunt.fail.fatal("Invalid plane flag in PLANE definition: " + planeFlag);
								}

								var sector = json.sectors[planeSector];

								// Register airfield sector and parking data
								if (!sector) {

									sector = json.sectors[planeSector] = {};

									for (var prop in planeSize) {
										sector[planeSize[prop]] = 0;
									}
								}

								sector[planeSizeID]++;
							}
							// Cargo truck
							else if (item.Name === "TRUCK:CARGO") {
								itemTypeID = itemTags.TRUCK_CARGO;
							}
							// Fuel truck
							else if (item.Name === "TRUCK:FUEL") {
								itemTypeID = itemTags.TRUCK_FUEL;
							}
							// Car vehicle
							else if (item.Name === "CAR") {
								itemTypeID = itemTags.CAR;
							}
							// Anti-aircraft position (MG)
							else if (item.Name === "AA:MG") {
								itemTypeID = itemTags.AA_MG;
							}
							// Anti-aircraft position (Flak)
							else if (item.Name === "AA:FLAK") {
								itemTypeID = itemTags.AA_FLAK;
							}
							// Search light
							else if (item.Name === "LIGHT:SEARCH") {
								itemTypeID = itemTags.LIGHT_SEARCH;
							}
							// Landing light
							else if (item.Name === "LIGHT:LANDING") {
								itemTypeID = itemTags.LIGHT_LANDING;
							}
							// Beacon and windsock
							else if (item.Name === "BEACON" || item.Name === "WINDSOCK") {

								itemTypeID = itemTags[item.Name];
								itemData.push(data.registerItemType(itemTypeData));
							}
							// Normal item
							else {

								itemTypeID = data.registerItemType(itemTypeData);

								// Decoration item tag
								if (item.Name === "DECO") {
									itemData.push(itemTags.DECO);
								}
								// Fuel item tag
								else if (item.Name === "FUEL") {
									itemData.push(itemTags.FUEL);
								}
							}

							var jsonItem = [];

							// Item type ID
							jsonItem.push(itemTypeID);

							// Item position
							jsonItem.push(item.XPos || 0);
							jsonItem.push(item.ZPos || 0);

							// Item orientation
							jsonItem.push(item.YOri || 0);

							// Item data
							itemData.forEach(function(data) {
								jsonItem.push(data);
							});

							jsonItems.push(jsonItem);

							totalItems++;
						}
						// Process any child items
						else if (item instanceof Item.Group && item.items.length) {

							var childItems = [];

							jsonItems.push(childItems);

							buildJSON(childItems, item.items);
						}
					});
				})(json.items, items[0].items);

				// Write output JSON items file
				grunt.file.write(
					fileDestination,
					JSON.stringify(json, null, "\t")
				);

				totalAirfields++;
			}

			totalBattles++;
		}

		// Write items type JSON data file
		grunt.file.write(
			"data/items.json",
			JSON.stringify(data.items, null, "\t")
		);

		var okMessage = "";

		okMessage += numeral(totalItems).format("0,0") + " ";
		okMessage += grunt.util.pluralize(totalItems, "item/items");
		okMessage += " processed from " + numeral(totalBattles).format("0,0") + " ";
		okMessage += grunt.util.pluralize(totalBattles, "battle/battles");
		okMessage += " and " + numeral(totalAirfields).format("0,0") + " ";
		okMessage += grunt.util.pluralize(totalAirfields, "airfield/airfields") + ".";

		grunt.log.ok(okMessage);
	});
};