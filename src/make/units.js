/** @copyright Simas Toleikis, 2015 */
"use strict";

var moment = require("moment");

// Generate available mission units
module.exports = function(mission, data) {

	var battle = mission.battle;
	var missionDate = mission.date;
	var planeStorages = new Set();

	// Unit index tables
	var unitsByID = Object.create(null);
	var unitsByAirfield = Object.create(null);
	var unitsByCountry = Object.create(null);

	// Process all battle units and build index lists
	for (var unitID in battle.units) {

		var unit = Object.create(null);
		var unitData = battle.units[unitID];

		// Ignore not active units (used for organizational data hierarchy only)
		if (!unitData.active) {
			continue;
		}

		var airfields = getAirfields(unitData);

		// Ignore units without active airfields
		if (!airfields.length) {
			continue;
		}

		var unitPlaneStorages = getPlaneStorages(unitData);

		// Ignore units without active plane storages (no planes)
		if (!unitPlaneStorages.length) {
			continue;
		}

		// Register unit plane storages
		unitPlaneStorages.forEach(function(planeStorage) {

			planeStorage.units = planeStorage.units || [];
			planeStorage.units.push(unitID);

			planeStorages.add(planeStorage);
		});

		unit.name = getName(unitData);

		// Unit alias (nickname)
		var alias = getAlias(unitData);

		if (alias) {
			unit.alias = alias;
		}

		unit.country = unitData.country;
		unit.planes = [];

		// TODO: Add full support for planesMin
		if (Number.isInteger(unitData.planesMax)) {
			unit.planes.required = mission.rand.integer(unitData.planesMin || 0, unitData.planesMax);
		}

		// TODO: Split units with multiple airfields
		unit.airfield = airfields[0];

		// Register unit to ID index
		unitsByID[unitID] = unit;

		// Register unit to airfields index
		unitsByAirfield[unit.airfield] = unitsByAirfield[unit.airfield] || {};
		unitsByAirfield[unit.airfield][unitID] = unit;

		// Register unit to country index
		unitsByCountry[unit.country] = unitsByCountry[unit.country] || {};
		unitsByCountry[unit.country][unitID] = unit;
	}

	// Distribute available planes from plane storages
	planeStorages.forEach(function(planeStorage) {

		// TODO: Improve plane distribution algorithm
		// TODO: Honor min/max plane counts
		// TODO: Pick planes based on rating

		while (planeStorage[1] > 0) {

			var planeID = planeStorage[0];
			var plane = mission.planesByID[planeID];

			// Handle plane groups
			if (Array.isArray(plane)) {
				planeID = mission.rand.pick(plane);
			}

			// Pick random unit
			var unitID = mission.rand.pick(planeStorage.units);
			var unit = unitsByID[unitID];

			if (unit.planes.required !== undefined && unit.planes.length >= unit.planes.required) {
				continue;
			}

			unit.planes.push(planeID);
			planeStorage[1]--;
		}
	});

	// Get unit airfields
	function getAirfields(unitData) {

		var airfields = [];

		// TODO: Dynamically generate rebase/transfer missions

		// Inherit airfield data from parent unit data
		while (!airfields.length && unitData) {

			var dataAirfields = unitData.airfields;
			unitData = battle.units[unitData.parent];

			if (!Array.isArray(dataAirfields)) {
				continue;
			}

			// Find matching airfields based on to/from date ranges
			for (var airfield of dataAirfields) {

				var airfieldID = airfield[0];

				if (missionDateIsBetween(airfield[1], airfield[2])) {

					// Non-existant airfield
					if (!battle.airfields[airfieldID]) {

						unitData = null;
						continue;
					}

					// Add found airfield entry
					if (airfields.indexOf(airfieldID) === -1) {
						airfields.push(airfieldID);
					}
				}
			}
		}

		return airfields;
	}

	// Get unit plane storages
	function getPlaneStorages(unitData) {

		var planeStorages = [];

		// Inherit plane storage data from parent unit data
		while (unitData) {

			var dataPlanes = unitData.planes;
			unitData = battle.units[unitData.parent];

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
	function getName(unitData) {

		var name = unitData.name;

		// Unit name in data files can be an array (to model name changes based on date)
		if (Array.isArray(name)) {

			name = null;

			for (var i = 0; i < unitData.name.length; i++) {

				var dataName = unitData.name[i];

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

	// Get unit alias
	function getAlias(unitData) {

		var alias;

		// Inherit unit alias from parent unit data
		while (unitData) {

			alias = unitData.alias;
			unitData = battle.units[unitData.parent];
		}

		return alias;
	}

	// Utility function used to validate to/from date ranges based on mission date
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

	// Static unit data index objects
	mission.unitsByID = Object.freeze(unitsByID);
	mission.unitsByAirfield = Object.freeze(unitsByAirfield);
	mission.unitsByCountry = Object.freeze(unitsByCountry);
};