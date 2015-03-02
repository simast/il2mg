/** @copyright Simas Toleikis, 2015 */
"use strict";

var moment = require("moment");

// Generate available mission units index
module.exports = function(mission, data) {

	var battle = mission.battle;
	var missionDate = mission.date;
	var planeStorages = new Set();

	// Unit index tables
	var unitsByID = Object.create(null);
	var unitsByAirfield = Object.create(null);
	var unitsByCountry = Object.create(null);
	var unitsByPlane = Object.create(null);

	// Process all battle units and build index lists
	for (var unitID in battle.units) {

		var unit = Object.create(null);
		var dataUnit = battle.units[unitID];

		// Ignore not active units (used for organizational data hierarchy only)
		if (!dataUnit.active) {
			continue;
		}

		var airfields = getAirfields(dataUnit);

		// Ignore units without active airfields
		if (!airfields.length) {
			continue;
		}

		var unitPlaneStorages = getPlaneStorages(dataUnit);

		// Ignore units without active plane storages
		if (!unitPlaneStorages.length) {
			continue;
		}

		// Register unit plane storages
		unitPlaneStorages.forEach(function(planeStorage) {

			planeStorage.units = planeStorage.units || new Set();
			planeStorage.units.add(unitID);

			planeStorages.add(planeStorage);
		});

		unit.name = getName(dataUnit);
		unit.country = dataUnit.country;
		unit.planes = [];

		// TODO: Split units with multiple airfields
		unit.airfield = airfields[0];

		unitsByID[unitID] = unit;
	}

	// Distribute planes from plane storages
	for (var planeStorage of planeStorages) {

		var planesCount = planeStorage[1];

		if (planesCount <= 0) {
			continue;
		}

		// TODO: Improve/fix planes distribution algorithm

		var planeID = planeStorage[0];
		var planesPerUnit = Math.round(planesCount / planeStorage.units.size);

		for (unitID of planeStorage.units) {

			for (var i = 0; i < planesPerUnit; i++) {
				unitsByID[unitID].planes.push(planeID);
			}
		}
	}

	// Get unit airfields
	function getAirfields(dataUnit) {

		var airfields = [];

		// TODO: Dynamically generate rebase/transfer missions

		// Look up (inherit) airfield data from parent units
		while (!airfields.length && dataUnit) {

			var dataAirfields = dataUnit.airfields;
			dataUnit = battle.units[dataUnit.parent];

			if (!Array.isArray(dataAirfields)) {
				continue;
			}

			// Find matching airfields based on to/from date ranges
			dataAirfields.forEach(function(airfield) {

				var airfieldID = airfield[0];

				if (missionDateIsBetween(airfield[1], airfield[2]) &&
						airfields.indexOf(airfieldID) === -1) {

					airfields.push(airfieldID);
				}
			});
		}

		return airfields;
	}

	// Get unit plane storages
	function getPlaneStorages(dataUnit) {

		var planeStorages = [];

		// Look up (inherit) plane storage data from parent units
		while (dataUnit) {

			var dataPlanes = dataUnit.planes;
			dataUnit = battle.units[dataUnit.parent];

			if (!Array.isArray(dataPlanes)) {
				continue;
			}

			// Find matching plane storages based on to/from date ranges
			dataPlanes.forEach(function(planeStorage) {

				if (missionDateIsBetween(planeStorage[2], planeStorage[3])) {
					planeStorages.push(planeStorage);
				}
			});
		}

		return planeStorages;
	}

	// Get unit name
	function getName(dataUnit) {

		var name = dataUnit.name;

		// Unit name in data files can be an array (to model name changes based on date)
		if (Array.isArray(name)) {

			name = null;

			for (var i = 0; i < dataUnit.name.length; i++) {

				var dataName = dataUnit.name[i];

				if (missionDateIsBetween(dataName[1], dataName[2])) {

					name = dataName[0];
					break;
				}
			}
		}

		// Validate unit name
		if (typeof name !== "string" || !name.length) {
			throw new Error("Invalid unit name data.");
		}

		return name;
	}

	// Utility function used to match mission date with to/from date ranges
	function missionDateIsBetween(dateFrom, dateTo) {

		dateFrom = parseDate(dateFrom).startOf("day");

		// Match to the end of the month when dateTo is not provided
		if (dateTo === undefined) {
			dateTo = moment(dateFrom).endOf("month").endOf("day");
		}
		else {
			dateTo = parseDate(dateTo).endOf("day");
		}

		if (!missionDate.isBefore(dateFrom) && !missionDate.isAfter(dateTo)) {
			return true;
		}

		return false;
	}

	// Utility function used to parse special date values in unit data files
	function parseDate(date) {

		// Special "start" value means the start date of the battle
		if (date === "start") {
			return mission.battleFrom;
		}
		// Special "end" value means the end date of the battle
		else if (date === "end") {
			return mission.battleTo;
		}
		// Other date format
		else {

			var dateParts = date.split("-");

			if (dateParts.length < 2 || dateParts.length > 3) {
				throw new Error("Invalid date format: " + date);
			}

			var momentDate = moment();

			momentDate.year(dateParts[0]);
			momentDate.month(Number(dateParts[1]) - 1);

			// Only month format (YYYY-MM) or start of the month format (YYYY-MM-start)
			if (dateParts[2] === undefined || dateParts[2] === "start") {
				momentDate.startOf("month");
			}
			// End of the month format (YYYY-MM-end)
			else if (dateParts[2] === "end") {
				momentDate.endOf("month");
			}
			// Full date format (YYYY-MM-DD)
			else {
				momentDate.date(Number(dateParts[2]));
			}

			return momentDate;
		}
	}
};