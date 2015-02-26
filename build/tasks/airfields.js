/** @copyright Simas Toleikis, 2015 */
"use strict";

module.exports = function(grunt) {

	// Grunt task used to import/convert raw airfields .Group to .json files
	grunt.registerTask("build:airfields", "Build airfields JSON files.", function() {

		var numeral = require("numeral");
		var data = require("../../src/data");
		var Item = require("../../src/item");
		var itemTags = require("../../src/make/airfields").itemTags;

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

				// Build output JSON object with recursion
				(function buildJSON(json, items) {

					items.forEach(function(item) {

						// Only scan supported item types
						if (item instanceof Item.Block || item instanceof Item.Bridge ||
								item instanceof Item.Vehicle || item instanceof Item.Flag) {

							var itemTypeID = null;
							var itemData = null;

							// Plane spot
							if (/^PLANE/.test(item.Name)) {

								itemTypeID = itemTags.PLANE;

								// TODO: Parse plane spot data
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
							// Normal item
							else {

								itemTypeID = data.registerItemType({
									type: item.type,
									script: item.Script,
									model: item.Model
								});

								// Decoration item tag
								if (item.Name === "DECO") {
									itemData = itemTags.DECO;
								}
								// Fuel item tag
								else if (item.Name === "FUEL") {
									itemData = itemTags.FUEL;
								}
								// Windsock tag
								else if (item.Name === "WINDSOCK") {
									itemData = itemTags.WINDSOCK;
								}
								// Beacon tag
								else if (item.Name === "BEACON") {
									itemData = itemTags.BEACON;
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
							if (itemData !== null) {
								jsonItem.push(itemData);
							}

							json.push(jsonItem);

							totalItems++;
						}
						// Process any child items
						else if (item instanceof Item.Group && item.items.length) {

							var childItems = [];

							json.push(childItems);

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