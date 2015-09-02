/** @copyright Simas Toleikis, 2015 */
"use strict";

// Generate available mission vehicles
module.exports = function makeVehicles() {

	var mission = this;
	var battle = mission.battle;

	// Vehicle index tables
	var vehicles = Object.create(null);
	var staticVehicles = Object.create(null);

	// Vehicle list is indexed by country ID
	battle.countries.forEach(function(countryID) {

		vehicles[countryID] = Object.create(null);
		staticVehicles[countryID] = Object.create(null);
	});

	// Process all vehicles and build index lists per country and type
	for (var i = 0; i < DATA.vehicles.length; i++) {

		var vehicle = DATA.vehicles[i];

		// Filter out vehicles with from/to dates
		if ((vehicle.from && mission.date.isBefore(vehicle.from)) ||
				(vehicle.to && mission.date.isAfter(vehicle.to))) {

			continue;
		}

		for (var c = 0; c < vehicle.countries.length; c++) {

			var countryID = vehicle.countries[c];

			// Vehicle is from a country not in this battle
			if (!vehicles[countryID]) {
				continue;
			}

			vehicle.type.forEach(function(vehicleType) {

				if (!vehicles[countryID][vehicleType]) {
					vehicles[countryID][vehicleType] = [];
				}

				vehicles[countryID][vehicleType].push(vehicle);

				// Add to static vehicle list
				if (vehicle.static) {

					if (!staticVehicles[countryID][vehicleType]) {
						staticVehicles[countryID][vehicleType] = [];
					}

					staticVehicles[countryID][vehicleType].push(vehicle);
				}
			});
		}
	}

	// Static plane data index objects
	mission.vehicles = Object.freeze(vehicles);
	mission.staticVehicles = Object.freeze(staticVehicles);
};