/** @copyright Simas Toleikis, 2015 */
"use strict";

var Item = require("../../item");

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

	var itemObject = this.createItem("Block", false);
	var itemDamaged = new Item("Damaged");

	itemObject.Model = wreck.model;
	itemObject.Script = wreck.script;
	itemObject.setPosition(item[1], item[2]);
	itemObject.setOrientation(item[3]);

	// TODO: Slightly vary wreck item orientation

	// Set plane/vehicle damaged state (for destroyed effect)
	itemDamaged["0"] = 1;
	itemObject.addItem(itemDamaged);

	return [itemObject];
};

// Get a list of plane/vehicle blocks to use as wrecks
function getWreckItems(mission) {

	var wreckItems = {
		planes: [],
		vehicles: []
	};

	var foundStatics = Object.create(null);

	// Collect plane static blocks
	for (var planeID in mission.planesByID) {

		var planeData = mission.planesByID[planeID];

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