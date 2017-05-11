/** @copyright Simas Toleikis, 2015 */
"use strict";

module.exports = function(grunt) {

	// Grunt task used to import/convert raw airfields .Group to .json files
	grunt.registerTask("build:airfields", "Build airfields JSON files.", () => {

		const numeral = require("numeral");
		const data = require("../../src/data");
		const Item = require("../../src/item");

		// Data constants
		const itemTag = data.itemTag;
		const itemFlag = data.itemFlag;
		const planeSize = data.planeSize;

		let totalBattles = 0;
		let totalAirfields = 0;
		let totalItems = 0;

		// Utility function used to get absolute Point item position
		function getPointPosition(item, point) {

			const pointOrientation = item.YOri * (Math.PI / 180) + Math.atan2(point.Y, point.X);
			const pointMagnitude = Math.sqrt(point.Y * point.Y + point.X * point.X);
			const positionX = item.XPos + pointMagnitude * Math.cos(pointOrientation);
			const positionZ = item.ZPos + pointMagnitude * Math.sin(pointOrientation);

			return [
				Number(positionX.toFixed(Item.PRECISION_POSITION)),
				Number(positionZ.toFixed(Item.PRECISION_POSITION))
			];
		}

		// Process airfields for each battle
		for (const battleID in data.battles) {

			const battle = data.battles[battleID];
			const airfieldsPath = "data/battles/" + battleID + "/airfields/";

			// Process all airfields
			for (const airfieldID in battle.airfields) {

				const fileSource = airfieldsPath + airfieldID + ".Group";
				const fileDestination = airfieldsPath + airfieldID + ".json";

				// Ignore airfields without .Group file
				if (!grunt.file.exists(fileSource)) {
					continue;
				}

				// Read raw airfield Group text file
				const items = Item.readTextFile(fileSource);

				// Group file should have a non-empty single Group item
				if (!items || !items.length || items.length !== 1 ||
						!(items[0] instanceof Item.Group)) {

					continue;
				}

				const json = {
					items: []
				};

				// Collected airfield routes data index
				const routesData = {};

				// Build output JSON object with recursion
				(function buildJSON(jsonItems, items) {

					items.forEach(item => {

						// Process group child items
						if (item instanceof Item.Group) {

							if (item.items.length) {

								const childItems = [];

								buildJSON(childItems, item.items);

								if (childItems.length) {
									jsonItems.push(childItems);
								}
							}

							return;
						}

						// Item position and orientation with forced precision
						const positionX = Number(item.XPos.toFixed(Item.PRECISION_POSITION));
						const positionY = Number(item.YPos.toFixed(Item.PRECISION_POSITION));
						const positionZ = Number(item.ZPos.toFixed(Item.PRECISION_POSITION));
						const orientation = Number(item.YOri.toFixed(Item.PRECISION_ORIENTATION));

						// Item type data
						const itemTypeData = {
							type: item.type,
							script: item.Script,
							model: item.Model
						};

						// Process supported item types
						if ((item instanceof Item.Block && !(item instanceof Item.Airfield)) ||
								item instanceof Item.Vehicle || item instanceof Item.Flag ||
								item instanceof Item.Train) {

							let itemTypeID = null;
							const itemData = [];

							// Plane spot
							if (/^PLANE/.test(item.Name)) {

								itemTypeID = itemTag.PLANE;

								const planeData = item.Name.split(":");
								let planeDataIndex = 1;

								// Plane sector number
								const planeSector = +planeData[planeDataIndex++];

								// Validate plane sector number
								if (!Number.isInteger(planeSector)) {
									grunt.fail.fatal("Invalid plane sector in: " + item.Name);
								}

								itemData.push(planeSector);

								// Plane taxi route number
								const planeTaxiData = planeData[planeDataIndex++].match(/(\-?\d+)(.*)/);
								let planeTaxiRoute;
								let planeTaxiOffset;

								if (planeTaxiData) {

									planeTaxiRoute = +planeTaxiData[1];
									planeTaxiOffset = +planeTaxiData[2];
								}

								if (!Number.isInteger(planeTaxiRoute)) {

									planeTaxiRoute = false;
									planeDataIndex--;
								}
								// Taxi spawn offset in meters
								else if (planeTaxiOffset) {
									planeTaxiRoute = [planeTaxiRoute, planeTaxiOffset];
								}

								itemData.push(planeTaxiRoute);

								// Plane size ID
								const planeSizeID = planeSize[planeData[planeDataIndex++]];

								// Validate plane size ID
								if (!Number.isInteger(planeSizeID)) {
									grunt.fail.fatal("Invalid plane size in: " + item.Name);
								}

								itemData.push(planeSizeID);

								// Camo plane flag
								const planeFlag = planeData[planeDataIndex++];

								if (planeFlag === "CAMO") {
									itemData.push(itemFlag.PLANE_CAMO);
								}
								else if (planeFlag !== undefined) {
									grunt.fail.fatal("Invalid plane flag in: " + item.Name);
								}

								if (!json.sectors) {
									json.sectors = {};
								}

								let sector = json.sectors[planeSector];

								// Register airfield sector and parking data
								if (!sector) {

									sector = json.sectors[planeSector] = {};

									for (const prop in planeSize) {
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
							// Anti-aircraft position (Train platform)
							else if (item.Name === "AA:TRAIN") {
								itemTypeID = itemTag.AA_TRAIN;
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
								itemData.push(data.registerItemType(itemTypeData));
							}
							// Normal item
							else {

								itemTypeID = data.registerItemType(itemTypeData);

								// Decoration item flag
								if (item.Name === "DECO") {
									itemData.push(itemFlag.BLOCK_DECO);
								}
								// Fuel item flag
								else if (item.Name === "FUEL") {
									itemData.push(itemFlag.BLOCK_FUEL);
								}
							}

							const jsonItem = [];

							// Item type ID
							jsonItem.push(itemTypeID);

							// Item position
							jsonItem.push(positionX);
							jsonItem.push(positionY);
							jsonItem.push(positionZ);

							// Item orientation
							jsonItem.push(orientation);

							// Item data
							itemData.forEach(data => {
								jsonItem.push(data);
							});

							jsonItems.push(jsonItem);

							totalItems++;
						}
						// Process effect items
						else if (item instanceof Item.Effect) {

							let effectTypeID = null;

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

							const effect = [itemTag.EFFECT];

							// Effect position
							effect.push(positionX);
							effect.push(positionY);
							effect.push(positionZ);

							// Effect type ID
							effect.push(effectTypeID);

							jsonItems.push(effect);

							totalItems++;
						}
						// Process taxi route items
						else if (item instanceof Item.Airfield) {

							// Taxi route
							if (/^TAXI/.test(item.Name)) {

								const taxiData = item.Name.split(":");
								const taxiID = +taxiData[1];

								// Validate taxi route ID
								if (!Number.isInteger(taxiID)) {
									grunt.fail.fatal("Invalid taxi route ID in: " + item.Name);
								}

								// Validate required taxi route child items
								if (!item.items[0] || item.items[0].type !== "Chart" || !item.items[0].items.length) {
									grunt.fail.fatal("Missing TAXI definition Chart and Point data.");
								}

								const taxiRunwayID = +taxiData[2];

								// Validate taxi runway ID
								if (!Number.isInteger(taxiRunwayID)) {
									grunt.fail.fatal("Invalid taxi runway ID in: " + item.Name);
								}

								// Invert taxi route flag
								const taxiFlag = taxiData[3];
								let taxiInvert = 0;

								if (taxiFlag === "INV") {
									taxiInvert = itemFlag.TAXI_INV;
								}
								else if (taxiFlag !== undefined) {
									grunt.fail.fatal("Invalid taxi route flag in: " + item.Name);
								}

								const taxiRoute = [];
								const taxiPoints = item.items[0].items;

								// Taxi route airfield item type ID
								taxiRoute.push(data.registerItemType(itemTypeData));

								// Taxi route runway ID and invertible flag
								taxiRoute.push(taxiRunwayID);
								taxiRoute.push(taxiInvert);

								// Taxi route spawn point for coop missions
								taxiRoute.push([positionX, positionZ, orientation]);

								// Build taxi route waypoint list
								const taxiPointsData = [];
								for (const taxiPoint of taxiPoints) {

									const taxiPointData = getPointPosition(item, taxiPoint);

									// Runway point
									if (taxiPoint.Type === 2) {
										taxiPointData.push(itemFlag.TAXI_RUNWAY);
									}

									taxiPointsData.push(taxiPointData);
								}

								taxiRoute.push(taxiPointsData);

								if (!json.taxi) {
									json.taxi = {};
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

								const waypointData = item.Name.split(":").slice(1);
								const routeID = +waypointData[0];

								// Validate route ID
								if (!Number.isInteger(routeID)) {
									grunt.fail.fatal("Invalid route ID in: " + item.Name);
								}

								// Validate waypoint target
								if (item.Targets.length !== 1) {
									grunt.fail.fatal("Invalid route waypoint target in: " + item.Name);
								}

								let waypointFlag = waypointData[1];

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

								const waypointIndex = item.Index;
								const waypointTarget = item.Targets[0];
								const waypoint = [];

								waypoint.push(Number(item.XPos.toFixed(Item.PRECISION_POSITION)));
								waypoint.push(Number(item.ZPos.toFixed(Item.PRECISION_POSITION)));

								if (waypointFlag) {
									waypoint.push(waypointFlag);
								}

								// Register route waypoint data
								const routeData = routesData[routeID] = routesData[routeID] || {
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
				for (const routeID in routesData) {

					const routeData = routesData[routeID];
					const jsonRoute = [];
					let nextWaypoint = routeData.first;

					do {

						jsonRoute.push(routeData[nextWaypoint].data);
						nextWaypoint = routeData[nextWaypoint].target;
					}
					while (nextWaypoint !== routeData.first);

					if (!json.routes) {
						json.routes = [];
					}

					json.routes.push(jsonRoute);
				}

				// Assign generated airfield data
				Object.assign(battle.airfields[airfieldID], json);

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
			"data/items/index.json",
			JSON.stringify(data.items, null, "\t")
		);

		let message = "";

		message += numeral(totalItems).format("0,0") + " ";
		message += grunt.util.pluralize(totalItems, "item/items");
		message += " processed from " + numeral(totalBattles).format("0,0") + " ";
		message += grunt.util.pluralize(totalBattles, "battle/battles");
		message += " and " + numeral(totalAirfields).format("0,0") + " ";
		message += grunt.util.pluralize(totalAirfields, "airfield/airfields") + ".";

		grunt.log.ok(message);
	});
};