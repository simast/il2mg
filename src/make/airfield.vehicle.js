/** @copyright Simas Toleikis, 2015 */
"use strict";

const {Vehicle, MCU_CMD_AttackArea} = require("../item");
const data = require("../data");
const {itemTag} = data;

// Make airfield vehicle item
module.exports = function makeAirfieldVehicle(airfield, item, isLive) {

	if (!airfield.country) {
		return;
	}

	const itemTagID = item[0];

	// Enforce airfield limits
	if (airfield.limits[itemTagID] <= 0) {
		return;
	}

	let vehicleType;
	let isStatic = false;
	let isTrain = false;
	let useAttackArea = false;

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
			isStatic = !isLive;
			break;
		}
		// Anti-aircraft (Flak)
		case itemTag.AA_FLAK: {

			vehicleType = "aa_flak";
			useAttackArea = true;
			break;
		}
		// Anti-aircraft (MG)
		case itemTag.AA_MG: {

			vehicleType = "aa_mg";
			useAttackArea = true;
			break;
		}
		// Anti-aircraft (Train platform)
		case itemTag.AA_TRAIN: {

			vehicleType = "train_aa";
			useAttackArea = true;
			isTrain = true;
			break;
		}
		// Search light
		case itemTag.LIGHT_SEARCH: {

			vehicleType = "search_light";
			useAttackArea = true;
			break;
		}
	}

	if (!vehicleType) {
		return;
	}

	const rand = this.rand;
	const vehicles = isStatic ? this.staticVehicles : this.vehicles;
	const countryID = rand.pick(airfield.countriesWeighted);

	if (!vehicles[countryID] || !vehicles[countryID][vehicleType]) {
		return;
	}

	let vehicle = rand.pick(vehicles[countryID][vehicleType]);

	if (isStatic) {
		
		if (!vehicle.static) {
			return;
		}
		
		// Use vehicle data from static block item
		vehicle = data.getItemType(vehicle.static);
	}
	
	let itemType = "Vehicle";
	
	if (isStatic) {
		itemType = vehicle;
	}
	else if (isTrain) {
		itemType = "Train";
	}

	// Create vehicle item
	const vehicleItem = this.createItem(itemType, false);

	let positionX = item[1];
	const positionY = item[2];
	let positionZ = item[3];

	// Slightly vary/randomize static vehicle position
	if (isStatic) {

		positionX = Math.max(positionX + rand.real(-1, 1), 0);
		positionZ = Math.max(positionZ + rand.real(-1, 1), 0);
	}

	// Slightly vary/randomize vehicle orientation
	const orientation = Math.max((item[4] + rand.real(-20, 20) + 360) % 360, 0);

	vehicleItem.setCountry(countryID);
	vehicleItem.setPosition(positionX, positionY, positionZ);
	vehicleItem.setOrientation(orientation);
	
	if (!isStatic) {

		vehicleItem.Model = vehicle.model;
		vehicleItem.Script = vehicle.script;
		vehicleItem.setName(vehicle.name);
		vehicleItem.createEntity(true);
		
		const zone = airfield.zone;

		// Attach vehicle to airfield "bubble" zone
		zone.onActivate.addObject(vehicleItem);
		zone.onDeactivate.addObject(vehicleItem);
		
		// Use attack area command (for AA vehicles)
		if (useAttackArea) {
			
			// Set unlimited ammo
			vehicleItem.LimitAmmo = 0;
			
			// TODO: Set vehicle AI level based on difficulty command-line param
			vehicleItem.AILevel = rand.pick([
				Vehicle.AI_LOW,
				Vehicle.AI_NORMAL,
				Vehicle.AI_HIGH
			]);
			
			let onAttackArea = zone.onAttackArea;
			
			// Create a shared attack area command (activated when airfield is loaded)
			if (!onAttackArea) {
	
				onAttackArea = zone.onAttackArea = zone.group.createItem("MCU_CMD_AttackArea");
				
				onAttackArea.setPositionNear(zone.onLoad);
				onAttackArea.AttackAir = 1; // Attack air targets
				onAttackArea.Time = 999 * 60; // Max 999 minutes
				
				// NOTE: When attack area command is with medium or low priority - the area
				// zone radius does not seem to be matter at all and AA vehicles will
				// automatically fire at their optimal range.
				onAttackArea.AttackArea = 0;
				onAttackArea.Priority = MCU_CMD_AttackArea.PRIORITY_MEDIUM;
	
				zone.onLoad.addTarget(onAttackArea);
			}

			// Set vehicle to use attack area command
			onAttackArea.addObject(vehicleItem);
		}
	}

	// Update airfield limits
	if (airfield.limits[itemTagID]) {
		airfield.limits[itemTagID]--;
	}

	return [vehicleItem];
};