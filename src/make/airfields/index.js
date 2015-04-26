/** @copyright Simas Toleikis, 2015 */
"use strict";

var Item = require("../../item");

// Data tags for special airfield items
var itemTags = {
	PLANE: -1, // Plane spot
	TRUCK_CARGO: -2, // Cargo truck
	TRUCK_FUEL: -3, // Fuel truck
	CAR: -4, // Car vehicle
	AA_MG: -5, // Anti-aircraft (MG)
	AA_FLAK: -6, // Anti-aircraft (Flak)
	LIGHT_SEARCH: -7, // Search light
	LIGHT_LAND: -8, // Landing light
	BEACON: -9, // Beacon
	WINDSOCK: -10, // Windsock
	EFFECT: -11, // Effect
	WRECK: -12 // Wreckage
};

// Data flags for airfield items
var itemFlags = {
	BLOCK_DECO: 1, // Decoration
	BLOCK_FUEL: 2, // Fuel item
	PLANE_CAMO: 1, // Camouflage plane spot
	EFFECT_SMOKE: 1, // House smoke effect
	EFFECT_CAMP: 2, // Campfire effect
	EFFECT_LAND: 3, // Landing fire effect
	EFFECT_SIREN: 4, // Siren effect
	TAXI_INV: 1, // Invertible taxi route
	TAXI_RUNWAY: 1, // Taxi runway point
	ROUTE_STOP: 1, // Route stop point
	ROUTE_ROAD: 2 // Route road formation
};

// Plane size constants (types/IDs)
var planeSize = {
	SMALL: 1,
	MEDIUM: 2,
	LARGE: 3,
	HUGE: 4
};

// Generate mission airfields
module.exports = function makeAirfields() {

	var mission = this;
	var data = mission.data;
	var params = mission.params;
	var battle = mission.battle;
	var rand = mission.rand;

	// Min and max plane size IDs
	var planeSizeMin = planeSize.SMALL;
	var planeSizeMax = planeSize.HUGE;

	// Airfield index tables
	var airfieldsByID = Object.create(null);
	var airfieldsByCoalition = Object.create(null);

	// Total airfield counts
	var totalAirfields = 0;
	var totalActive = 0;

	// Process each airfield
	for (var airfieldID in battle.airfields) {

		totalAirfields++;

		var airfieldData = battle.airfields[airfieldID];
		var airfield = airfieldsByID[airfieldID] = Object.create(null);

		// Copy airfield name and position from data definitions
		airfield.name = airfieldData.name;
		airfield.position = airfieldData.position;

		var airfieldUnits = mission.unitsByAirfield[airfieldID];

		// Process airfield units
		if (airfieldUnits) {

			var sectorsIndex = Object.create(null);
			var planesIndex = Object.create(null);
			var countries = Object.create(null);

			airfield.value = 0;
			airfield.taxi = airfieldData.taxi;
			airfield.countries = Object.create(null);
			airfield.countriesWeighted = []; // List of country IDs as a weighted array
			airfield.planesBySector = Object.create(null);
			airfield.planeItemsByUnit = Object.create(null);
			airfield.taxiSpawnsBySector = Object.create(null);
			airfield.taxiSectorsByPlaneGroup = Object.create(null);

			// Process unit planes list
			for (var unitID in airfieldUnits) {

				var unit = airfieldUnits[unitID];
				var groupID = unit.group;

				unit.planes.forEach(function(planeID) {

					var plane = mission.planesByID[planeID];
					var planeSizeID = planeSize[String(plane.size).toUpperCase()];

					if (planeSizeID) {

						// Airfield value is a sum of plane size IDs (with larger planes
						// adding more value than smaller ones)
						airfield.value += planeSizeID;

						// Register unit plane country data
						airfield.countriesWeighted.push(unit.country);
						countries[unit.country] = (countries[unit.country] || 0) + 1;

						// Build a list of plane groups indexed by plane size
						var planeSizeGroup = planesIndex[planeSizeID] = planesIndex[planeSizeID] || {};
						var planeGroup = planeSizeGroup[groupID] = planeSizeGroup[groupID] || [];

						planeGroup.push([planeID, unit.country, unitID]);
					}
				});
			}

			// Airfield countries list
			airfield.countries = Object.keys(countries).map(Number);

			// Sort countries list by number of units present on the airfield
			airfield.countries.sort(function(a, b) {
				return countries[b] - countries[a];
			});

			// Airfield main country
			airfield.country = airfield.countries[0];

			// Airfield coalition
			airfield.coalition = data.countries[airfield.country].coalition;

			if (!airfieldsByCoalition[airfield.coalition]) {
				airfieldsByCoalition[airfield.coalition] = [];
			}

			airfieldsByCoalition[airfield.coalition].push(airfield);

			// Build a list of sectors indexed by plane size
			for (var sectorID in airfieldData.sectors) {

				for (var planeSizeID in airfieldData.sectors[sectorID]) {

					var maxPlanes = getSectorMaxPlanes(sectorID, planeSizeID);
					var sectorsByPlaneSize = sectorsIndex[planeSizeID] || [];

					if (maxPlanes > 0) {
						sectorsByPlaneSize.push(sectorID);
					}

					sectorsIndex[planeSizeID] = sectorsByPlaneSize;
				}
			}

			// Assign planes to sectors
			(function() {

				// NOTE: During distribution large size planes take priority over small size
				for (var planeSizeID = planeSizeMax; planeSizeID >= planeSizeMin; planeSizeID--) {

					var planesBySize = planesIndex[planeSizeID];

					if (!planesBySize) {
						continue;
					}

					// TODO: Sort unit list by plane group size
					rand.shuffle(Object.keys(planesBySize)).forEach(function(unitID) {

						var unitPlanes = planesBySize[unitID];
						var planeSizeSectors = sectorsIndex[planeSizeID];

						if (planeSizeSectors) {

							// Sort indexed list of sectors by best fit for plane size
							planeSizeSectors.sort(function(a, b) {

								var sectorSizeA = getSectorMaxPlanes(a, planeSizeID);
								var sectorSizeB = getSectorMaxPlanes(b, planeSizeID);

								return sectorSizeB - sectorSizeA;
							});

							for (var i = 0; i < planeSizeSectors.length; i++) {

								if (!unitPlanes.length) {
									break;
								}

								var sectorID = planeSizeSectors[i];
								var sectorMaxPlanes = getSectorMaxPlanes(sectorID, planeSizeID);
								var sectorPlanes = airfield.planesBySector[sectorID] = airfield.planesBySector[sectorID] || {};

								for (var n = 0; n < sectorMaxPlanes; n++) {

									var plane = unitPlanes.shift();
									var sector = airfieldData.sectors[sectorID];
									var sectorPlaneSize = [];

									for (var x = planeSizeID; x <= planeSizeMax; x++) {

										if (sector[x] > 0) {
											sectorPlaneSize.push(x);
										}
									}

									// Assign plane to sector plane parking spot
									sectorPlaneSize = rand.pick(sectorPlaneSize);
									sectorPlanes[sectorPlaneSize] = sectorPlanes[sectorPlaneSize] || [];
									sectorPlanes[sectorPlaneSize].push(plane);

									// Decrease sector plane spot count
									sector[sectorPlaneSize]--;

									if (!unitPlanes.length) {
										break;
									}
								}
							}
						}

						// Log a warning if unitPlanes.length is greater than 0 (could not
						// distribute all unit planes - not enough parking spots).
						unitPlanes.forEach(function(planeData) {

							log.W("Not enough plane spots!", {
								airfield: airfieldID,
								plane: planeData[0]
							});
						});
					});
				}
			})();

			totalActive++;
		}

		// Skip/continue if airfield has no items available
		if (!airfieldData.items || !airfieldData.items.length) {
			continue;
		}

		airfield.group = mission.createItem("Group");
		airfield.group.setName(airfield.name);

		// Airfield load event item
		// TODO: Implement airfield "bubble" and load/unload events
		if (airfield.country && airfield.value) {

			airfield.onLoad = airfield.group.createItem("MCU_TR_MissionBegin");
			airfield.onLoad.setPosition(airfield.position);
		}

		// Make airfield item limits
		makeAirfieldLimits.call(mission, airfield);

		// Make airfield vehicle routes
		makeAirfieldRoutes.call(mission, airfield, airfieldData.routes);

		// Walk/process each airfield item
		(function walkItems(items, isGroup) {

			// Used to delay normal item insertion until any of the special items
			// were included in a group. If no special items are used - all normal
			// items in a group are also not included. This allows to group, for
			// example, an anti-aircraft special item together with a normal decoration
			// item, but if the AA special item is not used - the AA decoration item
			// is also not included.
			var extraItems = [];
			var useExtraItems = false;

			items.forEach(function(item) {

				var itemTypeID = item[0];

				// Process item group
				if (Array.isArray(itemTypeID)) {

					rand.shuffle(item);

					if (isGroup) {
						extraItems.push(item);
					}
					else {
						walkItems(item, true);
					}

					return;
				}

				var itemObjects = null;

				// Normal static item
				if (itemTypeID >= 0) {

					if (isGroup) {
						extraItems.push(item);
					}
					else {
						itemObjects = makeAirfieldStatic.call(mission, airfield, item);
					}
				}
				// Special item
				else {

					// Plane item
					if (itemTypeID === itemTags.PLANE) {
						itemObjects = makeAirfieldPlane.call(mission, airfield, item);
					}
					// Beacon item
					else if (itemTypeID === itemTags.BEACON) {
						itemObjects = makeAirfieldBeacon.call(mission, airfield, item);
					}
					// Windsock item
					else if (itemTypeID === itemTags.WINDSOCK) {
						itemObjects = makeAirfieldWindsock.call(mission, airfield, item);
					}
					// Effect item
					else if (itemTypeID === itemTags.EFFECT) {
						itemObjects = makeAirfieldEffect.call(mission, airfield, item);
					}
					// Wreck item
					else if (itemTypeID === itemTags.WRECK) {
						itemObjects = makeAirfieldWreck.call(mission, airfield, item);
					}
					// Vehicle item
					else {
						itemObjects = makeAirfieldVehicle.call(mission, airfield, item);
					}

					// Use all extra normal items in a group if special item is used
					if (itemObjects && itemObjects.length) {
						useExtraItems = true;
					}
				}

				// Add generated item objects to airfield group
				if (Array.isArray(itemObjects) && itemObjects.length) {

					itemObjects.forEach(function(itemObject) {

						if (itemObject instanceof Item) {
							airfield.group.addItem(itemObject);
						}
					});
				}
			});

			// Include extra items
			if (useExtraItems && extraItems.length) {
				walkItems(extraItems, false);
			}

		})(rand.shuffle(airfieldData.items), false);
	}

	// Get max sector plane count by plane size
	function getSectorMaxPlanes(sectorID, planeSizeID) {

		var planeCount = 0;

		for (var i = planeSizeID; i <= planeSizeMax; i++) {
			planeCount += airfieldData.sectors[sectorID][i];
		}

		return planeCount;
	}

	// Static airfield data index objects
	mission.airfieldsByID = Object.freeze(airfieldsByID);
	mission.airfieldsByCoalition = Object.freeze(airfieldsByCoalition);

	// Log mission airfields info
	log.I("Airfields:", totalAirfields, {active: totalActive});
};

module.exports.itemTags = itemTags;
module.exports.itemFlags = itemFlags;
module.exports.planeSize = planeSize;

// Airfield make parts
var makeAirfieldLimits = require("./limits");
var makeAirfieldStatic = require("./static");
var makeAirfieldPlane = require("./plane");
var makeAirfieldBeacon = require("./beacon");
var makeAirfieldWindsock = require("./windsock");
var makeAirfieldEffect = require("./effect");
var makeAirfieldWreck = require("./wreck");
var makeAirfieldVehicle = require("./vehicle");
var makeAirfieldRoutes = require("./routes");