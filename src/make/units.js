/** @copyright Simas Toleikis, 2015 */
"use strict";

const moment = require("moment");
const data = require("../data");
const log = require("../log");

// Generate available mission units
module.exports = function makeUnits() {
	
	const battle = this.battle;
	const rand = this.rand;
	const planeStorages = new Set();
	
	// Utility function used to parse special date values in unit data files
	const parseDate = (date) => {

		// Special "start" value means the start date of the battle
		if (date === "start") {
			return this.battleFrom;
		}
		// Special "end" value means the end date of the battle
		else if (date === "end") {
			return this.battleTo;
		}
		// Other date format
		else {

			const dateParts = date.split("-");
			const momentDate = moment();

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
	};
	
	// Utility function used to validate to/from date ranges based on mission date
	const missionDateIsBetween = (dateFrom, dateTo, returnRange) => {

		dateFrom = parseDate(dateFrom).startOf("day");

		// Match to the end of the month when dateTo is not provided
		if (dateTo === undefined) {
			dateTo = moment(dateFrom).endOf("month").endOf("day");
		}
		else {
			dateTo = parseDate(dateTo).endOf("day");
		}

		if (!this.date.isBefore(dateFrom) && !this.date.isAfter(dateTo)) {

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
	};
	
	// Make unit airfields
	const makeAirfields = (unitData) => {

		const airfields = [];

		// TODO: Dynamically generate rebase/transfer missions

		const dataAirfields = unitData.airfields;

		if (!Array.isArray(dataAirfields)) {
			return airfields;
		}

		// Find matching airfields based on to/from date ranges
		for (const airfield of dataAirfields) {

			const airfieldID = airfield[0];

			if (missionDateIsBetween(airfield[1], airfield[2])) {

				let availability = 1;

				// Forth parameter in the array can be used to specify unit availability (%)
				if (typeof airfield[3] === "number") {
					availability = airfield[3];
				}

				availability = Math.max(Math.min(availability, 1), 0);

				// Add found airfield entry (with availability)
				airfields.push({
					id: airfieldID,
					availability: availability
				});
			}
		}

		return airfields;
	};

	// Make unit pilots
	const makePilots = (unitData) => {

		const pilots = [];
		const dataPilots = unitData.pilots;

		if (!Array.isArray(dataPilots)) {
			return pilots;
		}

		// Find matching pilots based on to/from date ranges
		for (const pilot of dataPilots) {

			const pilotFrom = pilot[2];

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
	};

	// Make unit plane storages
	const makePlaneStorages = (unitData) => {

		const planeStorages = [];
		const dataPlanes = unitData.planes;

		if (!Array.isArray(dataPlanes)) {
			return planeStorages;
		}

		// Find matching plane storages based on to/from date ranges
		dataPlanes.forEach((planeStorage) => {

			const dateRange = missionDateIsBetween(planeStorage[2], planeStorage[3], true);

			if (dateRange) {

				let planeCount = planeStorage[1];

				// Pick plane count from valid array range
				if (Array.isArray(planeCount)) {

					const maxPlanes = Math.max.apply(null, planeCount);
					const minPlanes = Math.min.apply(null, planeCount);
					const rangeDaysInterval = Math.abs(dateRange.from.diff(dateRange.to, "days"));
					const rangeDaysMission = this.date.diff(dateRange.from, "days");
					let planePercent = rangeDaysMission / rangeDaysInterval;

					// Use +-15% randomness
					planePercent = rand.real(planePercent - 0.15, planePercent + 0.15, true);
					planePercent = Math.max(planePercent, 0);
					planePercent = Math.min(planePercent, 1);

					// Pick plane count from valid range
					planeCount = planeCount[1] + ((planeCount[0] - planeCount[1]) * (1 - planePercent));
					planeCount = Math.round(planeCount);

					// Use extra +-1 plane randomness
					if (planeCount > 2) {
						planeCount += rand.pick([-1, 1]);
					}

					// Enforce min/max range bounds
					planeCount = Math.max(planeCount, minPlanes);
					planeCount = Math.min(planeCount, maxPlanes);

					planeStorage[1] = planeCount;
				}

				const planeID = planeStorage[0];

				// Only collect storages with valid plane IDs
				if (this.planes[planeID]) {
					planeStorages.push(planeStorage);
				}
			}
		});

		return planeStorages;
	};

	// Make unit name
	const makeName = (unitData) => {

		let name = unitData.name;
		
		// Unit name as an array (for name changes based on date)
		if (Array.isArray(name)) {

			name = null;

			for (const dataName of unitData.name) {

				if (missionDateIsBetween(dataName[1], dataName[2])) {

					name = dataName[0];
					break;
				}
			}
		}

		// Validate unit name
		if (typeof name !== "string" || !name.length) {
			throw new Error("Invalid unit name.");
		}

		return name;
	};

	// Make unit role
	const makeRole = (unitData) => {
		
		let role = unitData.role;

		// Unit role as an array (for role changes based on date)
		if (Array.isArray(role)) {

			role = null;

			for (const dataRole of unitData.role) {
				
				if (missionDateIsBetween(dataRole[1], dataRole[2])) {

					role = dataRole[0];
					break;
				}
			}
		}
		
		// Validate unit role
		if (typeof role !== "string" || !battle.roles[unitData.country][role]) {
			throw new Error("Invalid unit role.");
		}

		return role;
	};

	// Unit index tables
	const units = Object.create(null);
	const unitsByAirfield = Object.create(null);
	const unitsByCoalition = Object.create(null);
	const unitsByCountry = Object.create(null);

	// Unit weight table (by plane count)
	const unitsWeighted = [];

	// Total unit, plane and known pilot counts
	let totalUnits = 0;
	let totalPlanes = 0;
	let totalPilots = 0;

	// Process all battle units and build index lists
	for (const unitID in battle.units) {

		let unitData = battle.units[unitID];

		// Ignore dummy unit definitions (and groups used to catalog units)
		if (!unitData || !unitData.name) {
			continue;
		}

		const unitFrom = unitData.from;
		const unitTo = unitData.to;

		// Filter out units with from/to dates
		if ((unitFrom && this.date.isBefore(unitFrom, "day")) ||
				(unitTo && this.date.isAfter(unitTo, "day"))) {

			continue;
		}

		const unit = Object.create(null);
		let unitPlaneStorages = [];
		let unitAirfields = [];
		let unitPilots = [];

		unit.id = unitID;

		// Build unit data and register unit parent/group hierarchy
		while (unitData) {

			// Process unit data from current hierarchy
			for (const prop in unitData) {

				// Collect airfield data
				if (prop === "airfields") {

					if (unitAirfields.length) {
						continue;
					}

					unitAirfields = makeAirfields(unitData);
				}
				// Collect plane storage data
				else if (prop === "planes") {
					unitPlaneStorages = unitPlaneStorages.concat(makePlaneStorages(unitData));
				}
				// Collect pilot data
				else if (prop === "pilots") {

					if (unitPilots.length) {
						continue;
					}

					unitPilots = makePilots(unitData);
				}
				// Collect other unit data
				else if (unit[prop] === undefined) {

					// Resolve unit name
					if (prop === "name") {
						unit[prop] = makeName(unitData);
					}
					// Resolve unit role
					else if (prop === "role") {
						unit[prop] = makeRole(unitData);
					}
					// Copy other data
					else {
						unit[prop] = unitData[prop];
					}
				}
			}

			const unitParentID = unitData.parent;

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
			const unitGroup = units[unitParentID] || [];

			if (Array.isArray(unitGroup)) {

				unitGroup.push(unitID);
				units[unitParentID] = unitGroup;
			}

			unitData = battle.units[unitParentID];
		}

		const unitParts = [
			unit // Original unit
		];

		// Split unit into separate parts (based on number of airfields)
		// NOTE: Don't split units with planesMin/planesMax
		if (unitAirfields.length && !unit.planesMin && !unit.planesMax) {

			// Split unit into separate parts for each extra airfield
			for (let i = 1; i < unitAirfields.length; i++) {

				// Create a new unit part based on the original
				const unitPart = JSON.parse(JSON.stringify(unit));

				// Assign new unique unit ID
				unitPart.id = unitPart.id + "_" + i + rand.hex(3);

				// Register new unit in the parent group hierarchy
				let unitPartParentID = unitPart.parent;
				while (unitPartParentID) {

					const unitPartParent = units[unitPartParentID];

					if (Array.isArray(unitPartParent)) {
						unitPartParent.push(unitPart.id);
					}

					unitPartParentID = battle.units[unitPartParentID].parent;
				}

				unitParts.push(unitPart);
			}
		}

		// Randomize unit part and airfield lists
		rand.shuffle(unitParts);
		rand.shuffle(unitAirfields);

		// Distribute pilots to all unit parts
		if (unitPilots.length) {

			rand.shuffle(unitPilots);

			while (unitPilots.length) {

				const pilot = unitPilots.shift();
				const pilotUnit = rand.pick(unitParts);

				if (!pilotUnit.pilots) {
					pilotUnit.pilots = [];
				}

				pilotUnit.pilots.push(pilot);
			}
		}

		// Process each unit part
		unitParts.forEach((unit) => {

			const unitID = unit.id;

			// Assign random matching airfield and availability
			if (unitAirfields.length) {

				const airfield = unitAirfields.shift();

				unit.airfield = airfield.id;
				unit.availability = airfield.availability;
			}

			// Remove invalid unit definition (without plane storages or invalid airfield)
			if (!unitPlaneStorages.length || !unit.airfield || !battle.airfields[unit.airfield]) {

				// Clean up parent unit groups
				let parentID = unit.parent;
				while (parentID) {

					const parentUnit = units[parentID];

					if (Array.isArray(parentUnit)) {

						const parentUnitIndex = parentUnit.indexOf(unitID);

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

				return;
			}

			// Register unit plane storages
			unitPlaneStorages.forEach((planeStorage) => {

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
			const coalitionID = unit.coalition = data.countries[unit.country].coalition;
			unitsByCoalition[coalitionID] = unitsByCoalition[coalitionID] || Object.create(null);
			unitsByCoalition[coalitionID][unitID] = unit;

			// Register unit to country index
			unitsByCountry[unit.country] = unitsByCountry[unit.country] || Object.create(null);
			unitsByCountry[unit.country][unitID] = unit;
		});

		totalUnits++;
	}

	// Distribute available planes from plane storages
	planeStorages.forEach((planeStorage) => {

		// TODO: Improve plane distribution algorithm
		// TODO: Honor min/max plane counts
		// TODO: Pick planes based on rating

		let planeCount = planeStorage[1];

		while (planeCount > 0) {

			let planeID = planeStorage[0];
			const plane = this.planes[planeID];

			// Handle plane groups
			if (Array.isArray(plane)) {
				planeID = rand.pick(plane);
			}

			// Pick random unit
			const unitID = rand.pick(planeStorage.units);
			const unit = units[unitID];

			if (unit.planes.max !== undefined && unit.planes.length >= unit.planes.max) {
				continue;
			}

			unit.planes.push(planeID);
			unitsWeighted.push(unitID);

			// Set unit max pilots count (used to figure out known and unknown pilot ratio)
			if (unit.pilots) {

				// NOTE: We don't track exact pilot numbers per unit, but for each plane in
				// the unit we assign randomized 1.5 to 2.5 pilot count.
				unit.pilots.max = unit.pilots.max || 0;
				unit.pilots.max += rand.real(1.5, 2.5);
			}

			planeCount--;
			totalPlanes++;
		}
	});

	// Static unit data index objects
	this.units = Object.freeze(units);
	this.unitsByAirfield = Object.freeze(unitsByAirfield);
	this.unitsByCoalition = Object.freeze(unitsByCoalition);
	this.unitsByCountry = Object.freeze(unitsByCountry);
	
	// Static unit weight table (by plane count)
	this.unitsWeighted = Object.freeze(unitsWeighted);

	// Log mission units info
	log.I("Units:", totalUnits, {planes: totalPlanes, pilots: totalPilots});
};