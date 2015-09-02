/** @copyright Simas Toleikis, 2015 */
"use strict";

var Item = require("../item");

// Make airfield wreck item
module.exports = function makeAirfieldWreck(airfield, item) {

	if (!this.wreckItems) {
		this.wreckItems = getWreckItems(this);
	}

	// TODO: Limit number of wrecks per airfield

	var rand = this.rand;
	var wreck;

	// 25% chance to use vehicle for wreck
	if (rand.bool(0.25)) {
		wreck = rand.pick(this.wreckItems.vehicles);
	}
	// 75% chance to use plane for wreck
	else {
		wreck = rand.pick(this.wreckItems.planes);
	}

	if (!wreck) {
		return;
	}

	var wreckItem = this.createItem("Block", false);
	var damageItem = new Item("Damaged");

	var positionX = item[1];
	var positionY = item[2];
	var positionZ = item[3];
	var orientation = item[4];
	var orientationOffset = 15;

	// Slightly vary/randomize wreck item orientation
	orientation = orientation + rand.real(-orientationOffset, orientationOffset);
	orientation = Math.max((orientation + 360) % 360, 0);

	wreckItem.Model = wreck.model;
	wreckItem.Script = wreck.script;
	wreckItem.setPosition(positionX, positionY, positionZ);
	wreckItem.setOrientation(orientation);

	// Set plane/vehicle damaged state (for destroyed effect)
	damageItem["0"] = 1;
	wreckItem.addItem(damageItem);

	return [wreckItem];
};

// Get a list of plane/vehicle blocks to use as wrecks
function getWreckItems(mission) {
	
	// TODO: Filter out certain items (like Italian planes, etc)

	var wreckItems = {
		planes: [],
		vehicles: []
	};

	var foundStatics = Object.create(null);

	// Collect plane static blocks
	for (var planeID in mission.planes) {

		var planeData = mission.planes[planeID];

		// Ignore plane groups and planes without static blocks
		if (Array.isArray(planeData) || !planeData.static) {
			continue;
		}

		for (var plane of planeData.static) {

			if (foundStatics[plane.script]) {
				continue;
			}

			wreckItems.planes.push({
				script: plane.script,
				model: plane.model
			});

			foundStatics[plane.script] = true;
		}
	}

	// Collect vehicle static blocks
	for (var countryID in mission.staticVehicles) {

		var staticVehiclesByCountry = mission.staticVehicles[countryID];

		for (var vehicleType in staticVehiclesByCountry) {

			var staticVehiclesByType = staticVehiclesByCountry[vehicleType];

			for (var vehicle of staticVehiclesByType) {

				if (foundStatics[vehicle.static.script]) {
					continue;
				}

				wreckItems.vehicles.push({
					script: vehicle.static.script,
					model: vehicle.static.model
				});

				foundStatics[vehicle.static.script] = true;
			}
		}
	}

	return wreckItems;
}