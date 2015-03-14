/** @copyright Simas Toleikis, 2015 */
"use strict";

var moment = require("moment");

// Generate available mission units
module.exports = function(mission, data) {

	var battle = mission.battle;
	var rand = mission.rand;
	var missionDate = mission.date;
	var planeStorages = new Set();

	// Unit index tables
	var unitsByID = Object.create(null);
	var unitsByAirfield = Object.create(null);
	var unitsByCountry = Object.create(null);

	// Process all battle units and build index lists
	for (var unitID in battle.units) {

		var unitData = battle.units[unitID];

		// Ignore dummy unit definitions (and groups used to catalog units)
		if (!unitData || !unitData.name) {
			continue;
		}

		var unit = Object.create(null);
		var unitPlaneStorages = [];

		// Build unit data and register unit parent/group hierarchy
		while (unitData) {

			// Process unit data from current hierarchy
			for (var prop in unitData) {

				// Collect airfield data
				if (prop === "airfields") {

					if (unit.airfield) {
						continue;
					}

					var airfields = getAirfields(unitData);

					if (airfields.length) {
						unit.airfield = rand.pick(airfields);
					}
				}
				// Collect plane storage data
				else if (prop === "planes") {
					unitPlaneStorages = unitPlaneStorages.concat(getPlaneStorages(unitData));
				}
				// Collect other unit data
				else if (unit[prop] === undefined) {

					// Resolve unit name
					if (prop === "name") {
						unit[prop] = getName(unitData);
					}
					// Copy other data
					else {
						unit[prop] = unitData[prop];
					}
				}
			}

			var unitParentID = unitData.parent;

			// Unit group is the same as unit ID if there is no parent hierarchy
			if (!unit.group) {
				unit.group = unitID;
			}

			if (!unitParentID) {
				break;
			}
			// NOTE: Set unit group as a top-most parent
			else {
				unit.group = unitParentID;
			}

			// Register unit in the parent group hierarchy
			var unitGroup = unitsByID[unitParentID] || [];

			// Register a new child plane in the plane group
			if (Array.isArray(unitGroup)) {

				unitGroup.push(unitID);
				unitsByID[unitParentID] = unitGroup;
			}

			unitData = battle.units[unitParentID];
		}

		// Remove invalid unit definition (without plane storages or invalid airfield)
		if (!unitPlaneStorages.length || !unit.airfield || !battle.airfields[unit.airfield]) {

			// Clean up parent unit groups
			var parentID = unit.parent;
			while (parentID) {

				var parentUnit = unitsByID[parentID];

				if (Array.isArray(parentUnit)) {

					var parentUnitIndex = parentUnit.indexOf(unitID);

					// Remove unit from group
					if (parentUnitIndex > -1) {
						parentUnit.splice(parentUnitIndex, 1);
					}

					// Remove entire group if empty
					if (!parentUnit.length) {
						delete unitsByID[parentID];
					}
				}

				parentID = battle.units[parentID].parent;
			}

			continue;
		}

		// Register unit plane storages
		unitPlaneStorages.forEach(function(planeStorage) {

			planeStorage.units = planeStorage.units || [];
			planeStorage.units.push(unitID);

			planeStorages.add(planeStorage);
		});

		unit.planes = [];

		// TODO: Add full support for planesMin
		if (Number.isInteger(unit.planesMax)) {
			unit.planes.max = rand.integer(unit.planesMin || 0, unit.planesMax);
		}

		delete unit.planesMax;
		delete unit.planesMin;

		// Register unit to ID index
		unitsByID[unitID] = unit;

		// Register unit to airfields index
		unitsByAirfield[unit.airfield] = unitsByAirfield[unit.airfield] || Object.create(null);
		unitsByAirfield[unit.airfield][unitID] = unit;

		// Register unit to country index
		unitsByCountry[unit.country] = unitsByCountry[unit.country] || Object.create(null);
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
				planeID = rand.pick(plane);
			}

			// Pick random unit
			var unitID = rand.pick(planeStorage.units);
			var unit = unitsByID[unitID];

			if (unit.planes.max !== undefined && unit.planes.length >= unit.planes.max) {
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

		var dataAirfields = unitData.airfields;

		if (!Array.isArray(dataAirfields)) {
			return airfields;
		}

		// Find matching airfields based on to/from date ranges
		for (var airfield of dataAirfields) {

			var airfieldID = airfield[0];

			if (missionDateIsBetween(airfield[1], airfield[2])) {

				// Add found airfield entry
				if (airfields.indexOf(airfieldID) === -1) {
					airfields.push(airfieldID);
				}
			}
		}

		return airfields;
	}

	// Get unit plane storages
	function getPlaneStorages(unitData) {

		var planeStorages = [];
		var dataPlanes = unitData.planes;

		if (!Array.isArray(dataPlanes)) {
			return planeStorages;
		}

		// Find matching plane storages based on to/from date ranges
		dataPlanes.forEach(function(planeStorage) {

			if (missionDateIsBetween(planeStorage[2], planeStorage[3])) {

				var planeID = planeStorage[0];

				// Only collect storages with valid plane IDs
				if (mission.planesByID[planeID]) {
					planeStorages.push(planeStorage);
				}
			}
		});

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