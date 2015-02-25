/** @copyright Simas Toleikis, 2015 */
"use strict";

// Generate available mission vehicles index
module.exports = function(mission, data) {

	var battle = mission.battle;
	var vehicles = mission.vehicles = {};
	var staticVehicles = mission.staticVehicles = {};

	// Vehicle list is indexed by country ID
	battle.countries.forEach(function(countryID) {

		vehicles[countryID] = {};
		staticVehicles[countryID] = {};
	});

	// Build an indexed list of all vehicles per country and type
	for (var i = 0; i < data.vehicles.length; i++) {

		var vehicle = data.vehicles[i];

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
};