/** @copyright Simas Toleikis, 2015 */
"use strict";

var moment = require("moment");

// Generate available mission units
module.exports = function makeUnits() {

	var mission = this;
	var battle = mission.battle;
	var rand = mission.rand;
	var missionDate = mission.date;
	var planeStorages = new Set();

	// Unit index tables
	var units = Object.create(null);
	var unitsByAirfield = Object.create(null);
	var unitsByCoalition = Object.create(null);
	var unitsByCountry = Object.create(null);
	
	// Unit weight table (by plane count)
	var unitsWeighted = [];

	// Total unit, plane and known pilot counts
	var totalUnits = 0;
	var totalPlanes = 0;
	var totalPilots = 0;

	// Process all battle units and build index lists
	for (var unitID in battle.units) {

		var unitData = battle.units[unitID];

		// Ignore dummy unit definitions (and groups used to catalog units)
		if (!unitData || !unitData.name) {
			continue;
		}

		var unitFrom = unitData.from;
		var unitTo = unitData.to;
		
		// Filter out units with from/to dates
		if ((unitFrom && this.date.isBefore(unitFrom)) ||
				(unitTo && this.date.isAfter(unitTo) && !this.date.isSame(unitTo, "day"))) {

			continue;
		}
		
		var unit = Object.create(null);
		var unitPlaneStorages = [];
		
		unit.id = unitID;

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
					
					for (var airfieldID in airfields) {
						
						unit.airfield = airfieldID;
						unit.availability = airfields[airfieldID];
						
						// TODO: Distribute unit if more than one airfield is available
						break;
					}
				}
				// Collect plane storage data
				else if (prop === "planes") {
					unitPlaneStorages = unitPlaneStorages.concat(getPlaneStorages(unitData));
				}
				// Collect pilot data
				else if (prop === "pilots") {

					if (unit.pilots) {
						continue;
					}

					var pilots = getPilots(unitData);

					if (pilots.length) {
						unit.pilots = rand.shuffle(pilots);
					}
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
			var unitGroup = units[unitParentID] || [];

			// Register a new child plane in the plane group
			if (Array.isArray(unitGroup)) {

				unitGroup.push(unitID);
				units[unitParentID] = unitGroup;
			}

			unitData = battle.units[unitParentID];
		}

		// Remove invalid unit definition (without plane storages or invalid airfield)
		if (!unitPlaneStorages.length || !unit.airfield || !battle.airfields[unit.airfield]) {

			// Clean up parent unit groups
			var parentID = unit.parent;
			while (parentID) {

				var parentUnit = units[parentID];

				if (Array.isArray(parentUnit)) {

					var parentUnitIndex = parentUnit.indexOf(unitID);

					// Remove unit from group
					if (parentUnitIndex > -1) {
						parentUnit.splice(parentUnitIndex, 1);
					}

					// Remove entire group if empty
					if (!parentUnit.length) {
						delete units[parentID];
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
		units[unitID] = unit;

		// Register unit to airfields index
		unitsByAirfield[unit.airfield] = unitsByAirfield[unit.airfield] || Object.create(null);
		unitsByAirfield[unit.airfield][unitID] = unit;

		// Register unit to coalition index
		var coalition = DATA.countries[unit.country].coalition;
		unitsByCoalition[coalition] = unitsByCoalition[coalition] || Object.create(null);
		unitsByCoalition[coalition][unitID] = unit;

		// Register unit to country index
		unitsByCountry[unit.country] = unitsByCountry[unit.country] || Object.create(null);
		unitsByCountry[unit.country][unitID] = unit;

		totalUnits++;
	}

	// Distribute available planes from plane storages
	planeStorages.forEach(function(planeStorage) {

		// TODO: Improve plane distribution algorithm
		// TODO: Honor min/max plane counts
		// TODO: Pick planes based on rating
		
		var planeCount = planeStorage[1];

		while (planeCount > 0) {

			var planeID = planeStorage[0];
			var plane = mission.planes[planeID];

			// Handle plane groups
			if (Array.isArray(plane)) {
				planeID = rand.pick(plane);
			}

			// Pick random unit
			var unitID = rand.pick(planeStorage.units);
			var unit = units[unitID];

			if (unit.planes.max !== undefined && unit.planes.length >= unit.planes.max) {
				continue;
			}

			unit.planes.push(planeID);
			unitsWeighted.push(unitID);
			
			// Set unit max pilots count (used to figure out known and unknown pilot ratio)
			if (unit.pilots) {

				// NOTE: We don't track exact pilot numbers per unit, but for each plane in
				// the unit we assing randomized 1.5 to 2.5 pilot count. 
				unit.pilots.max = unit.pilots.max || 0;
				unit.pilots.max += rand.real(1.5, 2.5);
			}

			planeCount--;
			totalPlanes++;
		}
	});

	// Get unit airfields
	function getAirfields(unitData) {

		var airfields = Object.create(null);

		// TODO: Dynamically generate rebase/transfer missions

		var dataAirfields = unitData.airfields;

		if (!Array.isArray(dataAirfields)) {
			return airfields;
		}

		// Find matching airfields based on to/from date ranges
		for (var airfield of dataAirfields) {

			var airfieldID = airfield[0];

			if (missionDateIsBetween(airfield[1], airfield[2])) {
				
				var availability = 1;
				
				// Forth parameter in the array can be used to specify unit availability (%)
				if (typeof airfield[3] === "number") {
					availability = airfield[3];
				}
				
				availability = Math.max(Math.min(availability, 1), 0);
				
				// Add found airfield entry (with availability)
				airfields[airfieldID] = availability;
			}
		}

		return airfields;
	}

	// Get unit pilots
	function getPilots(unitData) {

		var pilots = [];
		var dataPilots = unitData.pilots;

		if (!Array.isArray(dataPilots)) {
			return pilots;
		}
		
		// Find matching pilots based on to/from date ranges
		for (var pilot of dataPilots) {

			var pilotFrom = pilot[2];

			if (pilotFrom === undefined || missionDateIsBetween(pilotFrom, pilot[3])) {

				// Add matching pilot entry
				pilots.push({
					name: pilot[0],
					rank: pilot[1]
				});
				
				totalPilots++;
			}
		}

		return pilots;
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
			
			var dateRange = missionDateIsBetween(planeStorage[2], planeStorage[3], true);

			if (dateRange) {
				
				var planeCount = planeStorage[1];
				
				// Pick plane count from valid array range
				if (Array.isArray(planeCount)) {
					
					var maxPlanes = Math.max.apply(null, planeCount);
					var minPlanes = Math.min.apply(null, planeCount);
					var rangeDaysInterval = Math.abs(dateRange.from.diff(dateRange.to, "days"));
					var rangeDaysMission = mission.date.diff(dateRange.from, "days");
					var planePercent = rangeDaysMission / rangeDaysInterval;
					
					// Use +-15% randomness
					planePercent = 1 - rand.real(planePercent - 0.15, planePercent + 0.15, true);
					
					// Pick plane count from valid range
					planeCount = planeCount[1] + ((planeCount[0] - planeCount[1]) * planePercent);
					planeCount = Math.round(planeCount);
					
					// Use +-1 plane randomness
					planeCount += rand.pick([-1, 1]);
					
					// Enforce min/max range bounds
					planeCount = Math.max(planeCount, minPlanes);
					planeCount = Math.min(planeCount, maxPlanes);
					
					planeStorage[1] = planeCount;
				}

				var planeID = planeStorage[0];

				// Only collect storages with valid plane IDs
				if (mission.planes[planeID]) {
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
	function missionDateIsBetween(dateFrom, dateTo, returnRange) {

		dateFrom = parseDate(dateFrom).startOf("day");

		// Match to the end of the month when dateTo is not provided
		if (dateTo === undefined) {
			dateTo = moment(dateFrom).endOf("month").endOf("day");
		}
		else {
			dateTo = parseDate(dateTo).endOf("day");
		}

		if (!missionDate.isBefore(dateFrom) && !missionDate.isAfter(dateTo)) {
			
			// Return from/to range as moment date objects
			if (returnRange) {
				
				return {
					from: dateFrom,
					to: dateTo
				};
			}
			
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
	mission.units = Object.freeze(units);
	mission.unitsByAirfield = Object.freeze(unitsByAirfield);
	mission.unitsByCoalition = Object.freeze(unitsByCoalition);
	mission.unitsByCountry = Object.freeze(unitsByCountry);
	
	// Static unit weight table (by plane count)
	mission.unitsWeighted = Object.freeze(unitsWeighted);

	// Log mission units info
	log.I("Units:", totalUnits, {planes: totalPlanes, pilots: totalPilots});
};