/** @copyright Simas Toleikis, 2015 */
"use strict"

const moment = require("moment")
const data = require("../data")
const log = require("../log")
const {isValidRebaseTask} = require("./task.rebase")

// Generate available mission units
module.exports = function makeUnits() {

	const {rand, battle, choice, map} = this
	const planeStorages = new Set()

	// Utility function used to match to/from date ranges based on mission date
	const matchMissionDateRange = data.matchDateRange.bind(undefined, {
		from: moment(battle.from).startOf("day"),
		to: moment(battle.to).endOf("day"),
		date: this.date
	})

	// Make unit airfields
	const makeAirfields = unitData => {

		const airfields = []
		const dataAirfields = unitData.airfields

		if (!Array.isArray(dataAirfields)) {
			return airfields
		}

		// Find matching airfields based on to/from date ranges
		for (const airfield of dataAirfields) {

			const airfieldID = airfield[0]

			if (matchMissionDateRange(airfield[1], airfield[2])) {

				// Forth parameter in the array can be used to specify unit availability (%)
				let availability = airfield[3]

				if (typeof availability !== "number") {
					availability = 1
				}

				availability = Math.max(availability, 0)

				// Add found airfield entry (with availability)
				airfields.push({
					id: airfieldID,
					availability: availability
				})
			}
		}

		return airfields
	}

	// Make unit pilots
	const makePilots = unitData => {

		const pilots = []
		const dataPilots = unitData.pilots

		if (!Array.isArray(dataPilots)) {
			return pilots
		}

		// Find matching pilots based on to/from date ranges
		for (const pilot of dataPilots) {

			if (matchMissionDateRange(pilot[2], pilot[3])) {

				// Add matching pilot entry
				pilots.push({
					name: pilot[0],
					rank: pilot[1]
				})

				totalPilots++
			}
		}

		return pilots
	}

	// Make unit plane storages
	const makePlaneStorages = unitData => {

		const planeStorages = []
		const dataPlanes = unitData.planes

		if (!Array.isArray(dataPlanes)) {
			return planeStorages
		}

		// Find matching plane storages based on to/from date ranges
		dataPlanes.forEach(dataPlaneStorage => {

			const planeID = dataPlaneStorage[0]

			// Only collect storages with valid plane IDs
			if (!this.planes[planeID]) {
				return
			}

			const dateFrom = dataPlaneStorage[2]
			const dateTo = dataPlaneStorage[3]
			const dateRange = matchMissionDateRange(dateFrom, dateTo)

			// Skip plane storages that do not match mission date
			if (!dateRange) {
				return
			}

			let planeCount = dataPlaneStorage[1]

			// Pick plane count from valid array range
			if (Array.isArray(planeCount)) {

				const maxPlanes = Math.max.apply(null, planeCount)
				const minPlanes = Math.min.apply(null, planeCount)
				const rangeDaysInterval = Math.abs(dateRange.from.diff(dateRange.to, "days"))
				const rangeDaysMission = this.date.diff(dateRange.from, "days")
				let planePercent = rangeDaysMission / rangeDaysInterval

				// Use +-15% randomness
				planePercent = rand.real(planePercent - 0.15, planePercent + 0.15, true)
				planePercent = Math.max(planePercent, 0)
				planePercent = Math.min(planePercent, 1)

				// Pick plane count from valid range
				planeCount = planeCount[1] + ((planeCount[0] - planeCount[1]) * (1 - planePercent))
				planeCount = Math.round(planeCount)

				// Use extra +-1 plane randomness
				if (planeCount > 2) {
					planeCount += rand.pick([-1, 1])
				}

				// Enforce min/max range bounds
				planeCount = Math.max(planeCount, minPlanes)
				planeCount = Math.min(planeCount, maxPlanes)
			}

			if (planeCount > 0) {

				planeStorages.push({
					plane: planeID,
					count: planeCount,
					units: []
				})
			}
		})

		return planeStorages
	}

	// Make unit name
	const makeName = unitData => {

		const name = unitData.name

		// Validate unit name
		if (typeof name !== "string" || !name.length) {
			throw new Error("Invalid unit name.")
		}

		return name
	}

	// Make unit role
	const makeRole = unitData => {

		let role = unitData.role

		// Unit role as an array (for role changes based on date)
		if (Array.isArray(role)) {

			role = null

			for (const dataRole of unitData.role) {

				if (matchMissionDateRange(dataRole[1], dataRole[2])) {

					role = dataRole[0]
					break
				}
			}
		}

		// Validate unit role
		if (typeof role !== "string" || !battle.roles[unitData.country][role]) {
			throw new Error("Invalid unit role.")
		}

		return role
	}

	// Unit index tables
	const units = Object.create(null)
	const unitsByAirfield = Object.create(null)
	const unitsByCoalition = Object.create(null)
	const unitsByCountry = Object.create(null)

	// Available unit list (weighted by plane count)
	const availableUnits = []

	// Total unit, plane and known pilot counts
	let totalUnits = 0
	let totalPlanes = 0
	let totalPilots = 0

	// Process all battle units and build index lists
	for (const unitID in battle.units) {

		let unitData = battle.units[unitID]

		// Ignore dummy unit definitions (and groups used to catalog units)
		if (!unitData || !unitData.name) {
			continue
		}

		const unitFrom = unitData.from
		const unitTo = unitData.to

		// Filter out units with from/to dates
		if ((unitFrom && this.date.isBefore(unitFrom, "day")) ||
				(unitTo && this.date.isAfter(unitTo, "day"))) {

			continue
		}

		const unit = Object.create(null)
		let unitPlaneStorages = []
		let unitAirfields = []
		let unitPilots = []

		unit.id = unitID

		// Build unit data and register unit parent/group hierarchy
		while (unitData) {

			// Process unit data from current hierarchy
			for (const prop in unitData) {

				// Collect airfield data
				if (prop === "airfields") {

					if (unitAirfields.length) {
						continue
					}

					unitAirfields = makeAirfields(unitData)
				}
				// Collect plane storage data
				else if (prop === "planes") {
					unitPlaneStorages = unitPlaneStorages.concat(makePlaneStorages(unitData))
				}
				// Collect pilot data
				else if (prop === "pilots") {

					if (unitPilots.length) {
						continue
					}

					unitPilots = makePilots(unitData)
				}
				// Collect other unit data
				else if (unit[prop] === undefined) {

					// Resolve unit name
					if (prop === "name") {
						unit[prop] = makeName(unitData)
					}
					// Resolve unit role
					else if (prop === "role") {
						unit[prop] = makeRole(unitData)
					}
					// Copy other data
					else {
						unit[prop] = unitData[prop]
					}
				}
			}

			const unitParentID = unitData.parent

			// Unit group is the same as unit ID if there is no parent hierarchy
			if (!unit.group) {
				unit.group = unitID
			}

			if (!unitParentID) {
				break
			}
			// NOTE: Set unit group as a top-most parent
			else {
				unit.group = unitParentID
			}

			// Register unit in the parent group hierarchy
			const unitGroup = units[unitParentID] || []

			if (Array.isArray(unitGroup)) {

				unitGroup.push(unitID)
				units[unitParentID] = unitGroup
			}

			unitData = battle.units[unitParentID]
		}

		const unitParts = [
			unit // Original unit
		]

		// Split unit into separate parts (based on number of airfields)
		// NOTE: Don't split units with planesMin/planesMax
		if (unitAirfields.length > 1 && !unit.planesMin && !unit.planesMax) {

			let lastSplitUnitIndex = unitAirfields.length - 1
			let unitTotalPlanes = 0

			unitPlaneStorages.forEach(planeStorage => {
				unitTotalPlanes += planeStorage.count
			})

			// Make sure not to split unit into more parts than planes available
			lastSplitUnitIndex = Math.min(lastSplitUnitIndex, unitTotalPlanes - 1)

			// Split unit into separate parts for each extra airfield
			for (let i = 1; i <= lastSplitUnitIndex; i++) {

				// Create a new unit part based on the original
				const unitPart = JSON.parse(JSON.stringify(unit))

				// Assign new unique unit ID
				unitPart.id = unitPart.id + "_" + i + rand.hex(3)

				// Register new unit in the parent group hierarchy
				let unitPartParentID = unitPart.parent
				while (unitPartParentID) {

					const unitPartParent = units[unitPartParentID]

					if (Array.isArray(unitPartParent)) {
						unitPartParent.push(unitPart.id)
					}

					unitPartParentID = battle.units[unitPartParentID].parent
				}

				unitParts.push(unitPart)

				// Update valid player unit choice list (for each new split unit)
				if (choice.unit && choice.unit.has(unitID)) {
					choice.unit.add(unitPart.id)
				}
			}
		}

		const rebase = {
			to: []
		}

		// Mark unit airfield transfer (rebase) targets
		if (unitAirfields.length > 1) {

			const airfieldFromID = unitAirfields[0].id
			const airfieldFrom = battle.airfields[airfieldFromID]

			rebase.from = airfieldFromID

			// Collect valid rebase airfield targets
			for (let i = 1; i < unitAirfields.length; i++) {

				const airfieldToID = unitAirfields[i].id
				const airfieldTo = battle.airfields[airfieldToID]

				// Check for valid rebase task
				if (isValidRebaseTask(airfieldFrom, airfieldTo, map)) {
					rebase.to.push(airfieldToID)
				}
			}
		}

		// Randomize unit part and airfield lists
		rand.shuffle(unitParts)

		if (unitParts.length > 1) {
			rand.shuffle(unitAirfields)
		}

		// Distribute pilots to all unit parts
		if (unitPilots.length) {

			rand.shuffle(unitPilots)

			while (unitPilots.length) {

				const pilot = unitPilots.shift()
				const pilotUnit = rand.pick(unitParts)

				if (!pilotUnit.pilots) {
					pilotUnit.pilots = []
				}

				pilotUnit.pilots.push(pilot)
			}
		}

		// Process each unit part
		unitParts.forEach(unit => {

			const unitID = unit.id

			// Assign random matching airfield and availability
			if (unitAirfields.length) {

				const airfield = unitAirfields.shift()

				unit.airfield = airfield.id
				unit.availability = airfield.availability
			}

			// Remove invalid unit definition (without plane storages or invalid airfield)
			if (!unitPlaneStorages.length || !unit.airfield || !battle.airfields[unit.airfield]) {

				// Clean up parent unit groups
				let parentID = unit.parent
				while (parentID) {

					const parentUnit = units[parentID]

					if (Array.isArray(parentUnit)) {

						const parentUnitIndex = parentUnit.indexOf(unitID)

						// Remove unit from group
						if (parentUnitIndex > -1) {
							parentUnit.splice(parentUnitIndex, 1)
						}

						// Remove entire group if empty
						if (!parentUnit.length) {
							delete units[parentID]
						}
					}

					parentID = battle.units[parentID].parent
				}

				return
			}

			// Assign rebase task targets
			if (unit.airfield === rebase.from && rebase.to.length) {
				unit.rebase = rebase.to
			}

			// Register unit plane storages
			unitPlaneStorages.forEach(planeStorage => {

				planeStorage.units.push(unitID)
				planeStorages.add(planeStorage)
			})

			unit.planes = []

			// TODO: Add full support for planesMin
			if (Number.isInteger(unit.planesMax)) {
				unit.planes.max = rand.integer(unit.planesMin || 0, unit.planesMax)
			}

			delete unit.planesMax
			delete unit.planesMin

			// Register unit to ID index
			units[unitID] = unit

			// Register unit to airfields index
			unitsByAirfield[unit.airfield] = unitsByAirfield[unit.airfield] || Object.create(null)
			unitsByAirfield[unit.airfield][unitID] = unit

			// Register unit to coalition index
			const coalitionID = unit.coalition = data.countries[unit.country].coalition
			unitsByCoalition[coalitionID] = unitsByCoalition[coalitionID] || Object.create(null)
			unitsByCoalition[coalitionID][unitID] = unit

			// Register unit to country index
			unitsByCountry[unit.country] = unitsByCountry[unit.country] || Object.create(null)
			unitsByCountry[unit.country][unitID] = unit
		})

		totalUnits++
	}

	// Distribute available planes from plane storages
	planeStorages.forEach(planeStorage => {

		// TODO: Improve plane distribution algorithm
		// TODO: Honor min/max plane counts
		// TODO: Pick planes based on rating

		let planeCount = planeStorage.count
		let unitIndex = planeStorage.units.length - 1

		while (planeCount > 0) {

			let planeID = planeStorage.plane
			let plane = this.planes[planeID]

			// Resolve plane groups
			while (Array.isArray(plane)) {

				planeID = rand.pick(plane)
				plane = this.planes[planeID]
			}

			// Resolve to a mapped (aliased) plane ID (if any)
			planeID = plane.id

			let unitID

			// Make sure unit will receive at least one plane!
			if (unitIndex >= 0) {
				unitID = planeStorage.units[unitIndex--]
			}
			// Use random plane distribution among all available units
			else {
				unitID = rand.pick(planeStorage.units)
			}

			const targetUnits = {
				[unitID]: false
			}

			// HACK: Since battle index does not contain split units and can't detect
			// a case where only a single plane is available in the inventory (to be
			// distributed to multiple units) - we have to duplicate player choosen
			// plane type for each unit (and have at least one such type in inventory).
			if (choice.plane && choice.plane.has(planeID)) {

				for (const unitID of planeStorage.units) {

					// Force unit to have at least one plane of this type
					if (units[unitID].planes.indexOf(planeID) === -1) {
						targetUnits[unitID] = true
					}
				}
			}

			for (const unitID in targetUnits) {

				const unit = units[unitID]
				const isForced = targetUnits[unitID]

				if (!isForced && unit.planes.max !== undefined &&
					unit.planes.length >= unit.planes.max) {

					continue
				}

				const availability = unit.availability
				let unitWeight = 0

				// Unit is available with all planes
				if (availability >= 1) {

					unitWeight = Math.floor(availability)

					const remainingAvailability = (availability - unitWeight)

					// Also apply remaining decimal availability as a random chance
					if (remainingAvailability > 0 && rand.bool(remainingAvailability)) {
						unitWeight++
					}
				}
				// NOTE: Special 0 availability valid for rebase tasks
				else if (unit.rebase && availability === 0) {
					unitWeight = 1
				}
				// Make sure unit is registered as available at least once
				else if (!unit.planes.length) {
					unitWeight = 1
				}
				// Pick unit plane availability based on a random chance
				else if (rand.bool(availability)) {
					unitWeight = 1
				}

				// Built available units list
				for (let i = 0; i < unitWeight; i++) {
					availableUnits.push(unitID)
				}

				unit.planes.push(planeID)

				// Set unit max pilots count (used to figure out known and unknown pilot ratio)
				if (unit.pilots) {

					// NOTE: We don't track exact pilot numbers per unit, but for each plane in
					// the unit we assign randomized 1.5 to 2.5 pilot count.
					unit.pilots.max = unit.pilots.max || 0
					unit.pilots.max += rand.real(1.5, 2.5)
				}

				totalPlanes++
			}

			planeCount--
		}
	})

	// Static unit data index objects
	this.units = Object.freeze(units)
	this.unitsByAirfield = Object.freeze(unitsByAirfield)
	this.unitsByCoalition = Object.freeze(unitsByCoalition)
	this.unitsByCountry = Object.freeze(unitsByCountry)

	// Available unit weighted list (by plane count)
	this.availableUnits = availableUnits

	// Log mission units info
	log.I("Units:", totalUnits, {planes: totalPlanes, pilots: totalPilots})
}