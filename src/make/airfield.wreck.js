/** @copyright Simas Toleikis, 2015 */
"use strict";

const data = require("../data");
const Item = require("../item");

// Make airfield wreck item
module.exports = function makeAirfieldWreck(airfield, item) {

	if (!this.wreckItems) {
		this.wreckItems = getWreckItems(this);
	}

	// TODO: Limit number of wrecks per airfield

	const rand = this.rand;
	let wreck;

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

	const wreckItem = this.createItem("Block", false);
	const damageItem = new Item("Damaged");

	const positionX = item[1];
	const positionY = item[2];
	const positionZ = item[3];
	let orientation = item[4];
	const orientationOffset = 15;

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

	const wreckItems = {
		planes: [],
		vehicles: []
	};

	const foundStatics = Object.create(null);

	// Collect plane static blocks
	for (const planeID in mission.planes) {

		const planeData = mission.planes[planeID];

		// Ignore plane groups and planes without static blocks
		if (Array.isArray(planeData) || !planeData.static) {
			continue;
		}

		for (const plane of planeData.static) {

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
	for (const countryID in mission.staticVehicles) {

		const staticVehiclesByCountry = mission.staticVehicles[countryID];

		for (const vehicleType in staticVehiclesByCountry) {

			const staticVehiclesByType = staticVehiclesByCountry[vehicleType];

			for (const vehicle of staticVehiclesByType) {
				
				const staticVehicle = data.getItemType(vehicle.static);

				if (foundStatics[staticVehicle.script]) {
					continue;
				}

				wreckItems.vehicles.push(staticVehicle);
				foundStatics[staticVehicle.script] = true;
			}
		}
	}

	return wreckItems;
}