/** @copyright Simas Toleikis, 2015 */
"use strict";

var itemTag = DATA.itemTag;

// Make airfield vehicle item
module.exports = function makeAirfieldVehicle(airfield, item, isLive) {

	if (!airfield.country) {
		return;
	}

	var itemTagID = item[0];

	// Enforce airfield limits
	if (airfield.limits[itemTagID] <= 0) {
		return;
	}

	var vehicleType;
	var isStatic = false;

	switch (itemTagID) {

		// Cargo truck
		case itemTag.TRUCK_CARGO: {

			vehicleType = "truck_cargo";
			isStatic = !isLive;
			break;
		}
		// Fuel truck
		case itemTag.TRUCK_FUEL: {

			vehicleType = "truck_fuel";
			isStatic = true;
			break;
		}
		// Car vehicle
		case itemTag.CAR: {

			vehicleType = "staff_car";
			break;
		}
		// Anti-aircraft (Flak)
		case itemTag.AA_FLAK: {

			vehicleType = "aa_flak";
			break;
		}
		// Anti-aircraft (MG)
		case itemTag.AA_MG: {

			vehicleType = "aa_mg";
			break;
		}
		// Search light
		case itemTag.LIGHT_SEARCH: {

			vehicleType = "search_light";
			break;
		}
	}

	if (!vehicleType) {
		return;
	}

	var rand = this.rand;
	var vehicles = isStatic ? this.staticVehicles : this.vehicles;
	var countryID = rand.pick(airfield.countriesWeighted);

	if (!vehicles[countryID] || !vehicles[countryID][vehicleType]) {
		return;
	}

	var vehicle = rand.pick(vehicles[countryID][vehicleType]);

	if (isStatic && !vehicle.static) {
		return;
	}

	// Create vehicle item
	var vehicleItem = this.createItem(isStatic ? "Block" : "Vehicle", false);

	var positionX = item[1];
	var positionY = item[2];
	var positionZ = item[3];

	// Slightly vary/randomize static vehicle position
	if (isStatic) {

		positionX = Math.max(positionX + rand.real(-1, 1), 0);
		positionZ = Math.max(positionZ + rand.real(-1, 1), 0);
	}

	// Slightly vary/randomize vehicle orientation
	var orientation = Math.max((item[4] + rand.real(-20, 20) + 360) % 360, 0);

	vehicleItem.Country = countryID;
	vehicleItem.Model = isStatic ? vehicle.static.model : vehicle.model;
	vehicleItem.Script = isStatic ? vehicle.static.script : vehicle.script;
	vehicleItem.setPosition(positionX, positionY, positionZ);
	vehicleItem.setOrientation(orientation);

	if (isStatic) {
		vehicleItem.Durability = 1500;
	}
	else {

		vehicleItem.setName(vehicle.name);
		vehicleItem.createEntity();
	}

	// Update airfield limits
	if (airfield.limits[itemTagID]) {
		airfield.limits[itemTagID]--;
	}

	// TODO: Attach vehicle to airfield bubble

	return [vehicleItem];
};