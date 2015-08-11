/** @copyright Simas Toleikis, 2015 */
"use strict";

var Vehicle = require("../item").Vehicle;
var MCU_CMD_AttackArea = require("../item").MCU_CMD_AttackArea;
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
	var useAttackArea = false;

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
			useAttackArea = true;
			break;
		}
		// Anti-aircraft (MG)
		case itemTag.AA_MG: {

			vehicleType = "aa_mg";
			useAttackArea = true;
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
		vehicleItem.createEntity(true);
		
		var zone = airfield.zone;

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
			
			var onAttackArea = zone.onAttackArea;
			
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