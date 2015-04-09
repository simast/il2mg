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
		var itemFlags = makeAirfields.itemFlags;
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
				json.runways = {};
				json.taxi = {};
				json.routes = [];

				// Collected airfield routes data index
				var routesData = {};

				// Build output JSON object with recursion
				(function buildJSON(jsonItems, items) {

					items.forEach(function(item) {

						// Process supported item types
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

								// Validate plane sector number
								if (!Number.isInteger(planeSector)) {
									grunt.fail.fatal("Invalid plane sector in: " + item.Name);
								}

								itemData.push(planeSector);

								// Plane taxi route number
								var planeTaxiRoute = +planeData[planeDataIndex++];

								if (!Number.isInteger(planeTaxiRoute)) {

									planeTaxiRoute = false;
									planeDataIndex--;
								}

								itemData.push(planeTaxiRoute);

								// Plane size ID
								var planeSizeID = planeSize[planeData[planeDataIndex++]];

								// Validate plane size ID
								if (!Number.isInteger(planeSizeID)) {
									grunt.fail.fatal("Invalid plane size in: " + item.Name);
								}

								itemData.push(planeSizeID);

								// Camo plane flag
								var planeFlag = planeData[planeDataIndex++];

								if (planeFlag === "CAMO") {
									itemData.push(itemFlags.PLANE_CAMO);
								}
								else if (planeFlag !== undefined) {
									grunt.fail.fatal("Invalid plane flag in: " + item.Name);
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
							else if (item.Name === "LIGHT:LAND") {
								itemTypeID = itemTags.LIGHT_LAND;
							}
							// Wreck
							else if (item.Name === "WRECK") {
								itemTypeID = itemTags.WRECK;
							}
							// Beacon and windsock
							else if (item.Name === "BEACON" || item.Name === "WINDSOCK") {

								itemTypeID = itemTags[item.Name];
								itemData.push(data.registerItemType(itemTypeData));
							}
							// Normal item
							else {

								itemTypeID = data.registerItemType(itemTypeData);

								// Decoration item flag
								if (item.Name === "DECO") {
									itemData.push(itemFlags.BLOCK_DECO);
								}
								// Fuel item flag
								else if (item.Name === "FUEL") {
									itemData.push(itemFlags.BLOCK_FUEL);
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
						// Process effect items
						else if (item instanceof Item.Effect) {

							var effectTypeID = null;

							// House smoke effect
							if (item.Name === "EFFECT:SMOKE") {
								effectTypeID = itemFlags.EFFECT_SMOKE;
							}
							// Campfire effect
							else if (item.Name === "EFFECT:CAMP") {
								effectTypeID = itemFlags.EFFECT_CAMP;
							}
							// Landing fire effect
							else if (item.Name === "EFFECT:LAND") {
								effectTypeID = itemFlags.EFFECT_LAND;
							}
							// Siren effect
							else if (item.Name === "EFFECT:SIREN") {
								effectTypeID = itemFlags.EFFECT_SIREN;
							}
							// Unknown effect item definition
							else {
								grunt.fail.fatal("Invalid effect definition: " + item.Name);
							}

							var effect = [itemTags.EFFECT];

							// Effect position
							effect.push(item.XPos);
							effect.push(item.YPos);
							effect.push(item.ZPos);

							// Effect type ID
							effect.push(effectTypeID);

							jsonItems.push(effect);

							totalItems++;
						}
						// Process airfield items (taxi routes and runways)
						else if (item instanceof Item.Airfield) {

							// Runway
							if (/^RUNWAY/.test(item.Name)) {

								var runwayData = item.Name.split(":");
								var runwayID = +runwayData[1];

								// Validate runway ID
								if (!Number.isInteger(runwayID)) {
									grunt.fail.fatal("Invalid runway ID in: " + item.Name);
								}

								// Validate required runway child items
								if (!item.items[0] || item.items[0].type !== "Chart" || !item.items[0].items.length) {
									grunt.fail.fatal("Missing RUNWAY definition Chart and Point data.");
								}

								var runway = [];

								// Runway spawn point for coop missions
								runway.push([
									item.XPos,
									item.ZPos,
									item.YOri
								]);

								var spawnNormal = [];
								var spawnInverted = [];
								var spawnPoints = item.items[0].items;
								var i;

								// Build normal direction spawn points
								for (i = 0; i < spawnPoints.length; i++) {

									spawnNormal.push(getPointPosition(item, spawnPoints[i]));

									// VPP point marks end of spawns for this direction
									if (spawnPoints[i].Type == 2) {
										break;
									}
								}

								// Build inverted direction spawn points
								for (i = spawnPoints.length - 1; i >= 0; i--) {

									spawnInverted.push(getPointPosition(item, spawnPoints[i]));

									// VPP point marks end of spawns for this direction
									if (spawnPoints[i].Type == 2) {
										break;
									}
								}

								runway.push(spawnNormal);
								runway.push(spawnInverted);

								json.runways[runwayID] = runway;
							}
							// Taxi route
							else if (/^TAXI/.test(item.Name)) {

								var taxiData = item.Name.split(":");
								var taxiID = +taxiData[1];

								// Validate taxi route ID
								if (!Number.isInteger(taxiID)) {
									grunt.fail.fatal("Invalid taxi route ID in: " + item.Name);
								}

								// Validate required taxi route child items
								if (!item.items[0] || item.items[0].type !== "Chart" || !item.items[0].items.length) {
									grunt.fail.fatal("Missing TAXI definition Chart and Point data.");
								}

								var taxiRunwayID = +taxiData[2];

								// Validate taxi runway ID
								if (!Number.isInteger(taxiRunwayID)) {
									grunt.fail.fatal("Invalid taxi runway ID in: " + item.Name);
								}

								// Invert taxi route flag
								var taxiFlag = taxiData[3];
								var taxiInvert = 0;

								if (taxiFlag === "INV") {
									taxiInvert = itemFlags.TAXI_INV;
								}
								else if (taxiFlag !== undefined) {
									grunt.fail.fatal("Invalid taxi route flag in: " + item.Name);
								}

								var taxiRoute = [];
								var taxiPoints = item.items[0].items;

								taxiRoute.push(taxiRunwayID);
								taxiRoute.push(taxiInvert);

								// Build taxi route waypoint list
								for (var taxiPoint of taxiPoints) {

									var taxiPointData = getPointPosition(item, taxiPoint);

									// Runway point
									if (taxiPoint.Type == 2) {
										taxiPointData.push(itemFlags.TAXI_RUNWAY);
									}

									taxiRoute.push(taxiPointData);
								}

								json.taxi[taxiID] = taxiRoute;
							}
							// Unknown Airfield item definition
							else {
								grunt.fail.fatal("Invalid airfield definition: " + item.Name);
							}

							totalItems++;
						}
						// Process waypoint items (routes)
						else if (item instanceof Item.MCU_Waypoint) {

							// Route waypoint
							if (/^ROUTE/.test(item.Name)) {

								var waypointData = item.Name.split(":").slice(1);
								var routeID = +waypointData[0];

								// Validate route ID
								if (!Number.isInteger(routeID)) {
									grunt.fail.fatal("Invalid route ID in: " + item.Name);
								}

								// Validate waypoint target
								if (item.Targets.length !== 1) {
									grunt.fail.fatal("Invalid route waypoint target in: " + item.Name);
								}

								var waypointFlag = waypointData[1];

								// Stop point flag
								if (waypointFlag === "STOP") {
									waypointFlag = itemFlags.ROUTE_STOP;
								}
								// Road formation flag
								else if (waypointFlag === "ROAD") {
									waypointFlag = itemFlags.ROUTE_ROAD;
								}
								// Unknown flag
								else if (waypointFlag !== undefined) {
									grunt.fail.fatal("Invalid route waypoint flag in: " + item.Name);
								}

								var waypointIndex = item.Index;
								var waypointTarget = item.Targets[0];
								var waypoint = [];

								waypoint.push(Number(item.XPos.toFixed(1)));
								waypoint.push(Number(item.ZPos.toFixed(1)));

								if (waypointFlag) {
									waypoint.push(waypointFlag);
								}

								// Register route waypoint data
								var routeData = routesData[routeID] = routesData[routeID] || {
									first: waypointIndex
								};

								routeData[waypointIndex] = {
									target: waypointTarget,
									data: waypoint
								};
							}
							// Unknown waypoint item definition
							else {
								grunt.fail.fatal("Invalid waypoint definition: " + item.Name);
							}

							totalItems++;
						}
						// Process any child items
						else if (item instanceof Item.Group && item.items.length) {

							var childItems = [];

							buildJSON(childItems, item.items);

							if (childItems.length) {
								jsonItems.push(childItems);
							}
						}
					});
				})(json.items, items[0].items);

				// Store airfield routes data
				(function() {

					for (var routeID in routesData) {

						var routeData = routesData[routeID];
						var jsonRoute = [];
						var nextWaypoint = routeData.first;

						do {

							jsonRoute.push(routeData[nextWaypoint].data);
							nextWaypoint = routeData[nextWaypoint].target;
						}
						while (nextWaypoint !== routeData.first);

						json.routes.push(jsonRoute);
					}
				})();

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

// Utility function used to get absolute Point item position
function getPointPosition(item, point) {

	var pointOrientation = item.YOri * (Math.PI / 180) + Math.atan2(point.Y, point.X);
	var pointMagnitude = Math.sqrt(point.Y * point.Y + point.X * point.X);

	return [
		Number((item.XPos + pointMagnitude * Math.cos(pointOrientation)).toFixed(2)),
		Number((item.ZPos + pointMagnitude * Math.sin(pointOrientation)).toFixed(2))
	];
}