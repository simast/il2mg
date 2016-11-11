/** @copyright Simas Toleikis, 2015 */
"use strict";

const {MCU_CMD_Formation} = require("../item");

// Make mission flight formation
module.exports = function makeFlightFormation(flight, isPlayer) {

	const rand = this.rand;
	const choice = this.choice;
	const task = flight.task;
	const unit = this.units[flight.unit];
	const formations = this.formations[flight.country];
	let formation;

	// List of valid (assigned) plane IDs to use for flight formation
	let validPlanes = [];

	// Make sure to pick planes from unit plane inventory at random
	rand.shuffle(unit.planes);

	// Find a first (random) matching plane formation required by the task and
	// which this unit can satisfy with its current plane inventory.
	for (const planeType of rand.shuffle(Object.keys(task.planes))) {

		// FIXME: If the unit had an index of number of planes available by plane
		// type value - we could optimize and get rid of a couple of iterations.

		let taskFormations = task.planes[planeType];
		const invalidFormations = Object.create(null);

		// Support for a single value formation type
		if (!Array.isArray(taskFormations)) {
			taskFormations = [taskFormations];
		}

		// Check formations in random order
		// TODO: Support weighted formation selection
		for (const taskFormation of rand.shuffle(taskFormations)) {

			// Ignore known invalid formations (when they are repeated for distribution)
			if (invalidFormations[taskFormation]) {
				continue;
			}

			const checkFormations = Object.create(null);
			let planesRequired;

			// Basic flight formation (with number of max planes specified)
			if (typeof taskFormation === "number") {
				checkFormations[taskFormation] = taskFormation;
			}
			// Advanced flight formation
			else {

				let formationAdvanced = formations[taskFormation];

				// Formation is not valid (because of from/to filter paramaters for example)
				if (!formationAdvanced) {

					invalidFormations[formationAdvanced] = true;
					continue;
				}

				// Check only a single formation (not a group)
				if (!Array.isArray(formationAdvanced)) {
					formationAdvanced = [formationAdvanced.id];
				}

				// Collect all formation types and their required plane counts
				for (const formationType of rand.shuffle(formationAdvanced)) {

					planesRequired = 0;

					for (const elementPlanesRequired of formations[formationType].elements.planes) {
						planesRequired += elementPlanesRequired;
					}

					checkFormations[formationType] = planesRequired;
				}
			}

			// Validate formation required plane count against available unit inventory
			for (const formationType in checkFormations) {

				const validPlanesByGroup = Object.create(null);

				validPlanes.length = 0;
				planesRequired = checkFormations[formationType];

				// Simple formation is identified by an integer max plane number
				const isSimpleFormation = !isNaN(parseInt(formationType, 10));

				for (const planeID of unit.planes) {

					const plane = this.planes[planeID];

					// Check for plane to be of the required type (and player choice)
					if (Array.isArray(plane.type) && plane.type.indexOf(planeType) >= 0 &&
						(!isPlayer || !choice.plane || choice.plane.has(planeID))) {

						let validPlanesGroup = validPlanesByGroup[plane.group];

						if (!validPlanesGroup) {
							validPlanesGroup = validPlanesByGroup[plane.group] = [];
						}

						validPlanesGroup.push(planeID);

						// Found a group of planes with all required plane types
						if (validPlanesGroup.length >= planesRequired) {

							validPlanes = validPlanesGroup;
							break;
						}
					}
				}

				// NOTE: A basic (numeric) formation type does not strictly require the number
				// of planes specified, but rather enforces a maximum of planes in a flight.
				if (!validPlanes.length && (isSimpleFormation || isPlayer)) {

					const validPlaneGroups = Object.keys(validPlanesByGroup);

					// Use a random group of valid planes
					if (validPlaneGroups.length) {

						validPlanes = validPlanesByGroup[rand.pick(validPlaneGroups)];

						// NOTE: To support player choice from battle index data (which is
						// missing exact plane counts and does not account for split units)
						// we have to cheat a bit by creating extra planes for the player
						// flight when number of found matching planes is below required count.
						if (!isSimpleFormation) {

							while (validPlanes.length < planesRequired) {
								validPlanes.push(rand.pick(validPlanes));
							}
						}
					}
				}

				// Set found matching formation
				if (validPlanes.length > 0 && (isSimpleFormation || validPlanes.length >= planesRequired)) {

					// Basic formation type
					if (isSimpleFormation) {

						formation = {};
						formation.elements = [validPlanes.length];
						formation.elements.planes = formation.elements;
					}
					// Advanced formation type
					else {
						formation = formations[formationType];
					}

					break;
				}
			}

			if (formation) {
				break;
			}

			invalidFormations[taskFormation] = true;
		}

		if (formation) {
			break;
		}
	}

	// Could not match unit to any of the required formations
	if (!formation) {
		throw ["No valid flight formation!", {unit: unit.id, task: flight.task.id}];
	}

	flight.elements = [];
	flight.formation = formation;
	flight.planes = 0; // Number of planes in all flight elements

	// Create requested number of flight elements
	formation.elements.planes.forEach((planesInElement, elementIndex) => {

		const element = [];

		// Pick available and required number of mission planes
		for (let p = 0; p < planesInElement; p++) {

			const planeID = validPlanes.shift();

			// Remove plane from unit plane inventory
			// TODO: Restore planes to inventory after the flight is finished
			unit.planes.splice(unit.planes.indexOf(planeID), 1);

			const plane = {
				plane: planeID
			};

			element.push(plane);

			// The first plane of the leading element is the flight leader plane
			// TODO: Let leaders pick the best plane available?
			if (!flight.leader) {
				flight.leader = plane;
			}

			flight.planes++;
		}

		// Inherit element state from parent flight
		element.state = flight.state;

		// Set element formation
		element.formation = MCU_CMD_Formation.TYPE_PLANE_V;

		// Use edge formation for two plane elements
		if (element.length === 2) {

			const edgeFormations = [
				MCU_CMD_Formation.TYPE_PLANE_EDGE_LEFT,
				MCU_CMD_Formation.TYPE_PLANE_EDGE_RIGHT
			];

			// Pick left/right edge formation direction based on element index
			if (formation.elements.planes.length > 1) {
				element.formation = edgeFormations[elementIndex % 2];
			}
			// Pick a random edge formation direction
			else {
				element.formation = rand.pick(edgeFormations);
			}
		}

		flight.elements.push(element);
	});
};