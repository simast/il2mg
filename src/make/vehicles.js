/** @copyright Simas Toleikis, 2015 */
"use strict";

const data = require("../data");

// Generate available mission vehicles
module.exports = function makeVehicles() {

	const battle = this.battle;

	// Vehicle index tables
	const vehicles = Object.create(null);
	const staticVehicles = Object.create(null);

	// Vehicle list is indexed by country ID
	battle.countries.forEach((countryID) => {

		vehicles[countryID] = Object.create(null);
		staticVehicles[countryID] = Object.create(null);
	});

	// Process all vehicles and build index lists per country and type
	for (let i = 0; i < data.vehicles.length; i++) {

		const vehicle = data.vehicles[i];

		// Filter out vehicles with from/to dates
		if ((vehicle.from && this.date.isBefore(vehicle.from)) ||
				(vehicle.to && this.date.isAfter(vehicle.to))) {

			continue;
		}

		for (let c = 0; c < vehicle.countries.length; c++) {

			const countryID = vehicle.countries[c];

			// Vehicle is from a country not in this battle
			if (!vehicles[countryID]) {
				continue;
			}

			vehicle.type.forEach((vehicleType) => {

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
	this.vehicles = Object.freeze(vehicles);
	this.staticVehicles = Object.freeze(staticVehicles);
};