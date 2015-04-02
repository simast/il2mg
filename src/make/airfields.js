/** @copyright Simas Toleikis, 2015 */
"use strict";

var Item = require("../item");

// Data tags for airfield items
var itemTags = {
	WINDSOCK: -10, // Windsock
	BEACON: -9, // Beacon
	LIGHT_LANDING: -8, // Landing light
	LIGHT_SEARCH: -7, // Search light
	AA_FLAK: -6, // Anti-aircraft (Flak)
	AA_MG: -5, // Anti-aircraft (MG)
	CAR: -4, // Car vehicle
	TRUCK_FUEL: -3, // Fuel truck
	TRUCK_CARGO: -2, // Cargo truck
	PLANE: -1, // Plane spot
	DECO: 1, // Decoration
	FUEL: 2 // Fuel item
};

// Plane size constants (types/IDs)
var planeSize = {
	SMALL: 1,
	MEDIUM: 2,
	LARGE: 3,
	HUGE: 4
};

// Generate mission airfields
module.exports = function(mission, data) {

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
		var countriesWeighted = []; // List of country IDs as a weighted array
		var planesBySector = {};

		// Process airfield units
		if (airfieldUnits) {

			var sectorsIndex = {};
			var planesIndex = {};
			var countries = {};

			airfield.value = 0;
			airfield.countries = {};

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
						countriesWeighted.push(unit.country);
						countries[unit.country] = (countries[unit.country] || 0) + 1;

						// Build a list of plane groups indexed by plane size
						var planeSizeGroup = planesIndex[planeSizeID] = planesIndex[planeSizeID] || {};
						var planeGroup = planeSizeGroup[groupID] = planeSizeGroup[groupID] || [];

						planeGroup.push([planeID, unit.country]);
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
								var sectorPlanes = planesBySector[sectorID] = planesBySector[sectorID] || {};

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

		var airfieldLimits = getAirfieldLimits();
		var airfieldGroup = mission.createItem("Group");

		airfieldGroup.setName(airfield.name);

		// Make airfield vehicle routes
		makeVehicleRoutes();

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

				var itemObject = null;

				// Normal static item
				if (itemTypeID >= 0) {

					if (isGroup) {
						extraItems.push(item);
					}
					else {
						itemObject = makeStaticItem(item);
					}
				}
				// Special item
				else {

					// Plane item
					if (itemTypeID === itemTags.PLANE) {
						itemObject = makePlane(item);
					}
					// Beacon item
					else if (itemTypeID === itemTags.BEACON) {
						itemObject = makeBeacon(item);
					}
					// Windsock item
					else if (itemTypeID === itemTags.WINDSOCK) {
						itemObject = makeWindsock(item);
					}
					// Vehicle item
					else {
						itemObject = makeVehicle(item);
					}

					// Use all extra normal items in a group if special item is used
					if (itemObject) {
						useExtraItems = true;
					}
				}

				// Add generated item object to airfield group
				if (itemObject) {
					airfieldGroup.addItem(itemObject);
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

	// Get airfield item limits
	function getAirfieldLimits() {

		var value = airfield.value || 0;
		var time = mission.time;
		var limits = Object.create(null);

		limits[itemTags.TRUCK_CARGO] = 0;
		limits[itemTags.TRUCK_FUEL] = 0;
		limits[itemTags.CAR] = 0;
		limits[itemTags.AA_MG] = 0;
		limits[itemTags.AA_FLAK] = 0;
		limits[itemTags.LIGHT_SEARCH] = 0;

		if (value > 0) {

			// TODO: Modify TRUCK_CARGO and TRUCK_FUEL limits based on mission complexity param
			limits[itemTags.TRUCK_CARGO] = Math.round(Math.min(Math.max(value / 10, 4), 24));
			limits[itemTags.TRUCK_FUEL] = Math.round(Math.min(Math.max(value / 20, 2), 12));

			// Anti-aircraft vehicle limits
			limits[itemTags.AA_MG] = Math.round(Math.min(Math.max(value / 25, 2), 7));
			limits[itemTags.AA_FLAK] = Math.round(Math.min(Math.max(value / 40, 0), 5));

			// Only add search lights for night time periods
			if (time.evening || time.night || time.dawn) {
				limits[itemTags.LIGHT_SEARCH] = Math.round(Math.min(Math.max(value / 40, 0), 4));
			}

			// Only max one staff car per airfield
			limits[itemTags.CAR] = 1;
		}

		// TODO: Add DECO item limits (based on mission complexity param)

		return limits;
	}

	// Make a normal static item
	function makeStaticItem(item) {

		var itemType = data.getItemType(item[0]);
		var itemData = item[4];
		var itemObject = mission.createItem(itemType.type, false);

		itemObject.Model = itemType.model;
		itemObject.Script = itemType.script;
		itemObject.setPosition(item[1], item[2]);
		itemObject.setOrientation(item[3]);

		// Decoration item
		if (itemData === itemTags.DECO) {
			itemObject.Durability = 500;
		}

		return itemObject;
	}

	// Make a beacon item
	function makeBeacon(item) {

		if (!airfield.country) {
			return;
		}

		var itemType = data.getItemType(item[4]);
		var itemObject = mission.createItem(itemType.type, false);

		itemObject.Model = itemType.model;
		itemObject.Script = itemType.script;
		itemObject.setPosition(item[1], item[2]);
		itemObject.setOrientation(item[3]);

		// TODO: Make beacons only for player related airfields
		// TODO: Set different beacon channels

		itemObject.Country = airfield.country;
		itemObject.BeaconChannel = 1;

		itemObject.createEntity();

		return itemObject;
	}

	// Make a windsock item
	function makeWindsock(item) {

		if (!airfield.country) {
			return;
		}

		var itemType = data.getItemType(item[4]);
		var itemObject = mission.createItem(itemType.type, false);

		itemObject.Model = itemType.model;
		itemObject.Script = itemType.script;
		itemObject.setPosition(item[1], item[2]);
		itemObject.setOrientation(item[3]);

		itemObject.createEntity();

		// TODO: Attach windsock to airfield bubble

		return itemObject;
	}

	// Make a vehicle item
	function makeVehicle(item, isLive) {

		if (!airfield.country) {
			return;
		}

		var itemTagID = item[0];

		// Enforce airfield limits
		if (airfieldLimits[itemTagID] <= 0) {
			return;
		}

		var vehicleType;
		var isStatic = false;

		switch (itemTagID) {

			// Cargo truck
			case itemTags.TRUCK_CARGO: {

				vehicleType = "truck_cargo";
				isStatic = !isLive;
				break;
			}
			// Fuel truck
			case itemTags.TRUCK_FUEL: {

				vehicleType = "truck_fuel";
				isStatic = true;
				break;
			}
			// Car vehicle
			case itemTags.CAR: {

				vehicleType = "staff_car";
				break;
			}
			// Anti-aircraft (Flak)
			case itemTags.AA_FLAK: {

				vehicleType = "aa_flak";
				break;
			}
			// Anti-aircraft (MG)
			case itemTags.AA_MG: {

				vehicleType = "aa_mg";
				break;
			}
			// Search light
			case itemTags.LIGHT_SEARCH: {

				vehicleType = "search_light";
				break;
			}
		}

		if (!vehicleType) {
			return;
		}

		var vehicles = isStatic ? mission.staticVehicles : mission.vehicles;
		var countryID = rand.pick(countriesWeighted);

		if (!vehicles[countryID] || !vehicles[countryID][vehicleType]) {
			return;
		}

		var vehicle = rand.pick(vehicles[countryID][vehicleType]);

		if (isStatic && !vehicle.static) {
			return;
		}

		// Create vehicle item
		var itemObject = mission.createItem(isStatic ? "Block" : "Vehicle", false);

		var positionX = item[1];
		var positionZ = item[2];

		// Slightly vary/randomize static vehicle position
		if (isStatic) {

			positionX = Math.max(positionX + rand.real(-1, 1), 0);
			positionZ = Math.max(positionZ + rand.real(-1, 1), 0);
		}

		// Slightly vary/randomize vehicle orientation
		var orientation = Math.max((item[3] + rand.real(-20, 20) + 360) % 360, 0);

		itemObject.Country = countryID;
		itemObject.Model = isStatic ? vehicle.static.model : vehicle.model;
		itemObject.Script = isStatic ? vehicle.static.script : vehicle.script;
		itemObject.setPosition(positionX, positionZ);
		itemObject.setOrientation(orientation);

		if (isStatic) {
			itemObject.Durability = 1500;
		}
		else {

			itemObject.setName(vehicle.name);
			itemObject.createEntity();
		}

		// Update airfield limits
		if (airfieldLimits[itemTagID]) {
			airfieldLimits[itemTagID]--;
		}

		// TODO: Attach vehicle to airfield bubble

		return itemObject;
	}

	// Make a plane item
	function makePlane(item) {

		var planeSector = item[4];
		var planeTaxiRoute = item[5];
		var planeMaxSize = item[6];

		if (!planesBySector[planeSector] || !planesBySector[planeSector][planeMaxSize]) {
			return;
		}

		var planeData = planesBySector[planeSector][planeMaxSize].shift();

		if (!planeData) {
			return;
		}

		var plane = mission.planesByID[planeData[0]];
		var staticPlanes = rand.shuffle(plane.static || []);
		var planeStatic;
		var planeCamo = (item[7] > 0);
		var planeSizeID = planeSize[String(plane.size).toUpperCase()];

		// 75% chance to use camouflaged static plane when camo flag is set
		if (planeCamo) {
			planeCamo = rand.bool(0.75);
		}

		// Find static plane model
		for (var staticPlane of staticPlanes) {

			if ((staticPlane.camo && !planeCamo) || (planeCamo && !staticPlane.camo)) {
				continue;
			}

			planeStatic = staticPlane;
			break;
		}

		// No matching static planes found
		if (!planeStatic) {
			return;
		}

		// Create static plane item
		var itemObject = mission.createItem("Block", false);

		var positionX = item[1];
		var positionZ = item[2];
		var orientation = item[3];
		var orientationOffset = 15;

		// 25% chance to slightly move plane position forward (with taxi routes only)
		if (planeTaxiRoute !== false && !planeStatic.camo && rand.bool(0.25)) {

			var positionOffsetMin = 10;
			var positionOffsetMax = 25;

			// Limit position offset for player-only taxi routes
			if (planeTaxiRoute === 0) {

				positionOffsetMin = 5;
				positionOffsetMax = 12;
			}

			var positionOffset = rand.real(positionOffsetMin, positionOffsetMax, true);
			var orientationRad = orientation * (Math.PI / 180);

			positionX += positionOffset * Math.cos(orientationRad);
			positionZ += positionOffset * Math.sin(orientationRad);

			orientationOffset = 45;
		}

		// Slightly vary/randomize plane orientation
		orientation = orientation + rand.real(-orientationOffset, orientationOffset);
		orientation = Math.max((orientation + 360) % 360, 0);

		itemObject.Country = planeData[1];
		itemObject.Durability = 2500 + (planeSizeID * 2500);
		itemObject.Model = planeStatic.model;
		itemObject.Script = planeStatic.script;
		itemObject.setPosition(positionX, positionZ);
		itemObject.setOrientation(orientation);

		return itemObject;
	}

	// Make airfield vehicle routes
	function makeVehicleRoutes() {

		// TODO: Create only max one live vehicle route during the night

		if (!airfield.value || !airfield.country || !airfieldData.routes ||
				!airfieldData.routes.vehicle) {

			return;
		}

		var vehicleRoutes = airfieldData.routes.vehicle;
		var vehicleRoutesMax = 0;

		// Limit number of vehicle routes based on airfield value and available routes
		vehicleRoutesMax = Math.max(Math.round(airfield.value / 28), 1);
		vehicleRoutesMax = Math.min(vehicleRoutesMax, 5);
		vehicleRoutesMax = Math.min(vehicleRoutesMax, vehicleRoutes.length);

		if (!vehicleRoutesMax) {
			return;
		}

		rand.shuffle(vehicleRoutes);

		while (vehicleRoutesMax--) {

			// Weighted vehicle pool (chance) array
			var vehiclePool = rand.shuffle([
				itemTags.TRUCK_CARGO,
				itemTags.TRUCK_CARGO,
				itemTags.TRUCK_CARGO,
				itemTags.CAR
			]);

			var vehicle = null;

			// Create a live vehicle item object for this route
			while (vehiclePool.length && !vehicle) {

				vehicle = makeVehicle([
					vehiclePool.shift(),
					airfield.position[0],
					airfield.position[2],
					0
				], true);
			}

			// Most likely a result of airfield vehicle limits
			if (!vehicle) {
				continue;
			}

			var route = vehicleRoutes.shift();
			var routeGroup = airfieldGroup.createItem("Group");
			var waypointVehicle = rand.integer(0, route.length - 1);
			var waypointFirst = null;
			var waypointLast = null;
			var isRoadFormation = false; // Default is offroad formation
			var waypointPriority = Item.MCU_Waypoint.priority;
			var formationType = Item.MCU_CMD_Formation.type;

			routeGroup.setName(vehicle.Name);
			routeGroup.addItem(vehicle);

			// 50% chance to reverse/invert the route
			if (rand.bool()) {
				route.reverse();
			}

			// TODO: Replace mission begin MCU with further/closer trigger
			var missionBegin = routeGroup.createItem("MCU_TR_MissionBegin");

			// Create route waypoints
			for (var w = 0; w < route.length; w++) {

				var item = route[w];
				var itemNext = route[w + 1] || route[0];
				var itemPrev = route[w - 1] || route[route.length - 1];
				var isStop = (item[2] === 1);
				var isRoad = (item[2] === 2);
				var isRoadNext = (itemNext[2] === 2);
				var isRoadPrev = (itemPrev[2] === 2);

				// Create waypoint MCU item
				var waypoint = routeGroup.createItem("MCU_Waypoint");

				if (waypointLast) {
					waypointLast.addTarget(waypoint);
				}
				else {
					waypointFirst = waypoint;
				}

				waypoint.addObject(vehicle);
				waypoint.setPosition(item[0], item[1]);

				// Set waypoint orientation (to the direction of next waypoint)
				var orientation = Math.atan2(itemNext[1] - item[1], itemNext[0] - item[0]);
				orientation = orientation * (180 / Math.PI);

				if (orientation < 0) {
					orientation += 360;
				}

				waypoint.setOrientation(orientation);

				// Compute waypoint speed
				var distance = Math.sqrt(Math.pow(item[0] - itemPrev[0], 2) + Math.pow(item[1] - itemPrev[1], 2));

				// Waypoint distance where speed is maximum
				var distanceMax = 180;

				// Offroad speed limits
				var speedMin = 25;
				var speedMax = 45;

				// Onroad speed limits
				if (isRoad && isRoadPrev) {
					speedMin = 40;
					speedMax = 65;
				}

				var speed = (distance / distanceMax) * speedMax;

				speed = Math.max(speed, speedMin);
				speed = Math.min(speed, speedMax);

				// A bit of randomness
				speed += rand.real(-3, 3);

				waypoint.Speed = Math.round(speed);

				// Compute waypoint area
				var b = Math.pow(item[0] - itemPrev[0], 2) + Math.pow(item[1] - itemPrev[1], 2);
				var a = Math.pow(item[0] - itemNext[0], 2) + Math.pow(item[1] - itemNext[1], 2);
				var c = Math.pow(itemNext[0] - itemPrev[0], 2) + Math.pow(itemNext[1] - itemPrev[1], 2);

				var angle = Math.acos((a + b - c) / Math.sqrt(4 * a * b));
				var angleDiff = Math.abs(angle * (180 / Math.PI) - 180);
				var area = angleDiff / 180 * 40;

				// Waypoint area radius limits (from 10 to 20 meters)
				area = Math.min(Math.max(area, 10), 20);

				waypoint.Area = Math.round(area);
				waypoint.Priority = waypointPriority.LOW;

				waypointLast = waypoint;

				// Create a random stop waypoint timer
				if (isStop) {

					var stopTimer = routeGroup.createItem("MCU_Timer");

					stopTimer.Time = Number(rand.real(20, 60).toFixed(3));
					stopTimer.setPositionNear(waypoint);

					waypoint.addTarget(stopTimer);

					waypointLast = stopTimer;
				}

				var formation = null;

				// Road vehicle formation
				if (isRoad && !isRoadFormation) {

					formation = formationType.VEHICLE_COLUMN_ROAD;
					isRoadFormation = true;
				}
				// Offroad vehicle formation
				else if ((!isRoad && isRoadFormation) || (isRoad && !isRoadNext)) {

					formation = formationType.VEHICLE_COLUMN;
					isRoadFormation = false;
				}

				// Create formation command item
				if (formation !== null) {

					var formationCommand = routeGroup.createItem("MCU_CMD_Formation");

					formationCommand.FormationType = formation;
					formationCommand.addObject(vehicle);
					formationCommand.setPositionNear(waypoint);

					waypoint.addTarget(formationCommand);
				}

				// 25% chance to use each stop waypoint as vehicle starting point
				if (isStop && rand.bool(0.25)) {
					waypointVehicle = waypoint;
				}

				// Set random/assigned vehicle waypoint
				if (waypointVehicle === w) {
					waypointVehicle = waypoint;
				}
			}

			// Link last waypoint to the first (creating a loop)
			waypointLast.addTarget(waypointFirst);

			// Set vehicle position/orientation to starting waypoint
			vehicle.setPosition(waypointVehicle.XPos, waypointVehicle.YPos, waypointVehicle.ZPos);
			vehicle.setOrientation((vehicle.YOri + waypointVehicle.YOri) % 360);

			missionBegin.setPositionNear(vehicle);
			missionBegin.addTarget(waypointVehicle);
		}
	}

	// Static airfield data index objects
	mission.airfieldsByID = Object.freeze(airfieldsByID);
	mission.airfieldsByCoalition = Object.freeze(airfieldsByCoalition);

	// Log mission airfields info
	log.I("Airfields:", totalAirfields, {active: totalActive});
};

module.exports.itemTags = itemTags;
module.exports.planeSize = planeSize;