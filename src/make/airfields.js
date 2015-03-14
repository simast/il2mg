/** @copyright Simas Toleikis, 2015 */
"use strict";

var Item = require("../item");

// Data tags for airfield items
var itemTags = {
	LIGHT_LANDING: -8, // Landing light
	LIGHT_SEARCH: -7, // Search light
	AA_FLAK: -6, // Anti-aircraft (Flak)
	AA_MG: -5, // Anti-aircraft (MG)
	CAR: -4, // Car vehicle
	TRUCK_FUEL: -3, // Fuel truck
	TRUCK_CARGO: -2, // Cargo truck
	PLANE: -1, // Plane spot
	DECO: 1, // Decoration
	FUEL: 2, // Fuel item
	WINDSOCK: 3, // Windsock
	BEACON: 4 // Beacon
};

// Plane size types/IDs
var planeSize = {
	SMALL: 1,
	MEDIUM: 2,
	LARGE: 3,
	HUGE: 4
};

var planeSizeMin = planeSize.SMALL;
var planeSizeMax = planeSize.HUGE;

// Generate mission airfields
module.exports = function(mission, data) {

	var params = mission.params;
	var battle = mission.battle;
	var airfields = battle.airfields;
	var rand = mission.rand;

	for (var airfieldID in airfields) {

		var airfield = airfields[airfieldID];

		if (!airfield.items || !airfield.items.length) {
			continue;
		}

		var airfieldUnits = mission.unitsByAirfield[airfieldID];
		var countriesWeighted = []; // List of country IDs as a weighted array
		var planesBySector = {};

		// Process airfield units
		if (airfieldUnits) {

			var sectorsIndex = {};
			var planesIndex = {};

			// Build a list of plane groups indexed by plane size
			for (var unitID in airfieldUnits) {

				var unit = airfieldUnits[unitID];
				var groupID = unit.group;

				unit.planes.forEach(function(planeID) {

					var plane = mission.planesByID[planeID];
					var planeSizeID = planeSize[String(plane.size).toUpperCase()];

					if (planeSizeID) {

						countriesWeighted.push(unit.country);

						var planeSizeGroup = planesIndex[planeSizeID] = planesIndex[planeSizeID] || {};
						var planeGroup = planeSizeGroup[groupID] = planeSizeGroup[groupID] || [];

						planeGroup.push([planeID, unit.country]);
					}
				});
			}

			// Build a list of sectors indexed by plane size
			for (var sectorID in airfield.sectors) {

				for (var planeSizeID in airfield.sectors[sectorID]) {

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

						var planeSizeSectors = sectorsIndex[planeSizeID];

						// Sort indexed list of sectors by best fit for plane size
						planeSizeSectors.sort(function(a, b) {

							var sectorSizeA = getSectorMaxPlanes(a, planeSizeID);
							var sectorSizeB = getSectorMaxPlanes(b, planeSizeID);

							return sectorSizeB - sectorSizeA;
						});

						var unitPlanes = planesBySize[unitID];

						for (var i = 0; i < planeSizeSectors.length; i++) {

							if (!unitPlanes.length) {
								break;
							}

							var sectorID = planeSizeSectors[i];
							var sectorMaxPlanes = getSectorMaxPlanes(sectorID, planeSizeID);
							var sectorPlanes = planesBySector[sectorID] = planesBySector[sectorID] || {};

							for (var n = 0; n < sectorMaxPlanes; n++) {

								var plane = unitPlanes.shift();
								var sector = airfield.sectors[sectorID];
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

						// TODO: Log a warning if unitPlanes.length is greater than 0 (could
						// not distribute all unit planes - not enough parking spots).
					});
				}
			})();
		}

		var itemsGroup = new Item.Group();

		itemsGroup.setName(airfield.name);

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
				}

				var itemObjects = null;

				// Normal static item
				if (itemTypeID >= 0) {

					if (isGroup) {
						extraItems.push(item);
					}
					else {
						itemObjects = makeStaticItem(item);
					}
				}
				// Special item
				else {

					// Plane item
					if (itemTypeID === itemTags.PLANE) {
						itemObjects = makePlane(item);
					}
					// Vehicle item
					else {
						itemObjects = makeVehicle(item);
					}

					// Use all extra normal items in a group if special item is used
					if (itemObjects && itemObjects.length) {
						useExtraItems = true;
					}
				}

				// Add generated item objects to airfield group
				if (Array.isArray(itemObjects) && itemObjects.length) {

					itemObjects.forEach(function(itemObject) {

						// TODO: Build a items index (to quickly lookup items based on position)
						itemsGroup.addItem(itemObject);
					});
				}
			});

			// Include extra items
			if (useExtraItems && extraItems.length) {
				walkItems(extraItems, false);
			}

		})(rand.shuffle(airfield.items), false);

		// Add all items as a single airfield group in a mission file
		mission.addItem(itemsGroup);
	}

	// Get max sector plane count by plane size
	function getSectorMaxPlanes(sectorID, planeSizeID) {

		var planeCount = 0;

		for (var i = planeSizeID; i <= planeSizeMax; i++) {
			planeCount += airfield.sectors[sectorID][i];
		}

		return planeCount;
	}

	// Make a normal static item
	function makeStaticItem(item) {

		var itemType = data.getItemType(item[0]);
		var itemData = item[4];
		var itemObject = new Item[itemType.type]();

		itemObject.Model = itemType.model;
		itemObject.Script = itemType.script;
		itemObject.setPosition(item[1], item[2]);
		itemObject.setOrientation(item[3]);

		// Windsock item
		if (itemData === itemTags.WINDSOCK) {
			itemObject.createEntity();
		}
		// TODO: Beacon item
		else if (itemData === itemTags.BEACON) {

			if (!countriesWeighted.length) {
				return;
			}

			itemObject.Country = rand.pick(countriesWeighted);
			itemObject.BeaconChannel = 1;

			itemObject.createEntity();
		}

		return [itemObject];
	}

	// Make a vehicle item
	function makeVehicle(item) {

		var vehicleType;
		var isStatic = false;

		switch (item[0]) {

			// Cargo truck
			case itemTags.TRUCK_CARGO: {

				vehicleType = "truck_cargo";
				isStatic = true;
				break;
			}
			// Fuel truck
			case itemTags.TRUCK_FUEL: {

				vehicleType = "truck_fuel";
				isStatic = true;
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

		// Create vehicle item
		var itemObject = isStatic ? new Item.Block() : new Item.Vehicle();

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

		if (!isStatic) {
			itemObject.createEntity();
		}

		return [itemObject];
	}

	// Make a plane item
	function makePlane(item) {

		var planeSector = item[4];
		var planeSize = item[6];

		if (!planesBySector[planeSector] || !planesBySector[planeSector][planeSize]) {
			return;
		}

		var planeData = planesBySector[planeSector][planeSize].shift();

		if (!planeData) {
			return;
		}

		var plane = mission.planesByID[planeData[0]];
		var staticPlanes = rand.shuffle(plane.static || []);
		var planeStatic;
		var planeCamo = (item[7] > 0);

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
		var itemObject = new Item.Block();

		// Slightly vary/randomize plane orientation
		var orientation = Math.max((item[3] + rand.real(-15, 15) + 360) % 360, 0);

		itemObject.Country = planeData[1];
		itemObject.Model = planeStatic.model;
		itemObject.Script = planeStatic.script;
		itemObject.setPosition(item[1], item[2]);
		itemObject.setOrientation(orientation);

		return [itemObject];
	}
};

module.exports.itemTags = itemTags;
module.exports.planeSize = planeSize;