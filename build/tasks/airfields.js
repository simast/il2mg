/** @copyright Simas Toleikis, 2015 */
"use strict";

// Load static global data
require("../../src/data");

var itemTag = DATA.itemTag;
var itemFlag = DATA.itemFlag;
var planeSize = DATA.planeSize;

var numeral = require("numeral");
var Item = require("../../src/item");

module.exports = function(grunt) {

	// Grunt task used to import/convert raw airfields .Group to .json files
	grunt.registerTask("build:airfields", "Build airfields JSON files.", function() {

		var totalBattles = 0;
		var totalAirfields = 0;
		var totalItems = 0;

		// Process airfields for each battle
		for (var battleID in DATA.battles) {

			var battle = DATA.battles[battleID];
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
						
						// Process group child items
						if (item instanceof Item.Group) {

							if (item.items.length) {
								
								var childItems = [];
	
								buildJSON(childItems, item.items);
	
								if (childItems.length) {
									jsonItems.push(childItems);
								}
							}
							
							return;
						}
						
						// Item position and orientation with forced precision
						var positionX = Number(item.XPos.toFixed(Item.PRECISION_POSITION));
						var positionY = Number(item.YPos.toFixed(Item.PRECISION_POSITION));
						var positionZ = Number(item.ZPos.toFixed(Item.PRECISION_POSITION));
						var orientation = Number(item.YOri.toFixed(Item.PRECISION_ORIENTATION));
						
						// Item type data
						var itemTypeData = {
							type: item.type,
							script: item.Script,
							model: item.Model
						};

						// Process supported item types
						if ((item instanceof Item.Block && !(item instanceof Item.Airfield)) ||
								item instanceof Item.Vehicle || item instanceof Item.Flag) {

							var itemTypeID = null;
							var itemData = [];

							// Plane spot
							if (/^PLANE/.test(item.Name)) {

								itemTypeID = itemTag.PLANE;

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
									itemData.push(itemFlag.PLANE_CAMO);
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
								itemTypeID = itemTag.TRUCK_CARGO;
							}
							// Fuel truck
							else if (item.Name === "TRUCK:FUEL") {
								itemTypeID = itemTag.TRUCK_FUEL;
							}
							// Car vehicle
							else if (item.Name === "CAR") {
								itemTypeID = itemTag.CAR;
							}
							// Anti-aircraft position (MG)
							else if (item.Name === "AA:MG") {
								itemTypeID = itemTag.AA_MG;
							}
							// Anti-aircraft position (Flak)
							else if (item.Name === "AA:FLAK") {
								itemTypeID = itemTag.AA_FLAK;
							}
							// Search light
							else if (item.Name === "LIGHT:SEARCH") {
								itemTypeID = itemTag.LIGHT_SEARCH;
							}
							// Landing light
							else if (item.Name === "LIGHT:LAND") {
								itemTypeID = itemTag.LIGHT_LAND;
							}
							// Wreck
							else if (item.Name === "WRECK") {
								itemTypeID = itemTag.WRECK;
							}
							// Beacon and windsock
							else if (item.Name === "BEACON" || item.Name === "WINDSOCK") {

								itemTypeID = itemTag[item.Name];
								itemData.push(DATA.registerItemType(itemTypeData));
							}
							// Normal item
							else {

								itemTypeID = DATA.registerItemType(itemTypeData);

								// Decoration item flag
								if (item.Name === "DECO") {
									itemData.push(itemFlag.BLOCK_DECO);
								}
								// Fuel item flag
								else if (item.Name === "FUEL") {
									itemData.push(itemFlag.BLOCK_FUEL);
								}
							}

							var jsonItem = [];

							// Item type ID
							jsonItem.push(itemTypeID);

							// Item position
							jsonItem.push(positionX);
							jsonItem.push(positionY === json.position[1] ? 0 : positionY);
							jsonItem.push(positionZ);

							// Item orientation
							jsonItem.push(orientation);

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
								effectTypeID = itemFlag.EFFECT_SMOKE;
							}
							// Campfire effect
							else if (item.Name === "EFFECT:CAMP") {
								effectTypeID = itemFlag.EFFECT_CAMP;
							}
							// Landing fire effect
							else if (item.Name === "EFFECT:LAND") {
								effectTypeID = itemFlag.EFFECT_LAND;
							}
							// Siren effect
							else if (item.Name === "EFFECT:SIREN") {
								effectTypeID = itemFlag.EFFECT_SIREN;
							}
							// Unknown effect item definition
							else {
								grunt.fail.fatal("Invalid effect definition: " + item.Name);
							}

							var effect = [itemTag.EFFECT];

							// Effect position
							effect.push(positionX);
							effect.push(positionY === json.position[1] ? 0 : positionY);
							effect.push(positionZ);

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
								
								// Runway airfield item type ID
								runway.push(DATA.registerItemType(itemTypeData));

								// Runway spawn point for coop missions
								runway.push([positionX, positionZ, orientation]);

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
									taxiInvert = itemFlag.TAXI_INV;
								}
								else if (taxiFlag !== undefined) {
									grunt.fail.fatal("Invalid taxi route flag in: " + item.Name);
								}

								var taxiRoute = [];
								var taxiPoints = item.items[0].items;
								
								// Taxi route airfield item type ID
								taxiRoute.push(DATA.registerItemType(itemTypeData));

								// Taxi route runway ID and invertible flag
								taxiRoute.push(taxiRunwayID);
								taxiRoute.push(taxiInvert);

								// Taxi route spawn point for coop missions
								taxiRoute.push([positionX, positionZ, orientation]);

								// Build taxi route waypoint list
								var taxiPointsData = [];
								for (var taxiPoint of taxiPoints) {

									var taxiPointData = getPointPosition(item, taxiPoint);

									// Runway point
									if (taxiPoint.Type == 2) {
										taxiPointData.push(itemFlag.TAXI_RUNWAY);
									}

									taxiPointsData.push(taxiPointData);
								}
								
								taxiRoute.push(taxiPointsData);

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
									waypointFlag = itemFlag.ROUTE_STOP;
								}
								// Road formation flag
								else if (waypointFlag === "ROAD") {
									waypointFlag = itemFlag.ROUTE_ROAD;
								}
								// Unknown flag
								else if (waypointFlag !== undefined) {
									grunt.fail.fatal("Invalid route waypoint flag in: " + item.Name);
								}

								var waypointIndex = item.Index;
								var waypointTarget = item.Targets[0];
								var waypoint = [];

								waypoint.push(Number(item.XPos.toFixed(Item.PRECISION_POSITION)));
								waypoint.push(Number(item.ZPos.toFixed(Item.PRECISION_POSITION)));

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
			JSON.stringify(DATA.items, null, "\t")
		);

		var message = "";

		message += numeral(totalItems).format("0,0") + " ";
		message += grunt.util.pluralize(totalItems, "item/items");
		message += " processed from " + numeral(totalBattles).format("0,0") + " ";
		message += grunt.util.pluralize(totalBattles, "battle/battles");
		message += " and " + numeral(totalAirfields).format("0,0") + " ";
		message += grunt.util.pluralize(totalAirfields, "airfield/airfields") + ".";

		grunt.log.ok(message);
	});
};

// Utility function used to get absolute Point item position
function getPointPosition(item, point) {

	var pointOrientation = item.YOri * (Math.PI / 180) + Math.atan2(point.Y, point.X);
	var pointMagnitude = Math.sqrt(point.Y * point.Y + point.X * point.X);
	var positionX = item.XPos + pointMagnitude * Math.cos(pointOrientation);
	var positionZ = item.ZPos + pointMagnitude * Math.sin(pointOrientation);

	return [
		Number(positionX.toFixed(Item.PRECISION_POSITION)),
		Number(positionZ.toFixed(Item.PRECISION_POSITION))
	];
}