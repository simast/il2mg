/** @copyright Simas Toleikis, 2015 */
"use strict";

const log = require("../log");
const makeFlight = require("./flight");

// Generate mission task forces
module.exports = function makeForces() {

	const rand = this.rand;
	const params = this.params;
	const choice = this.choice;
	const force = [];
	let flight;

	this.forces = [];

	// Select a matching player unit (from a weighted list filtered by choices)
	// FIXME: Filter only unique units (not a weighted list)
	const unit = this.units[rand.pick(this.unitsWeighted.filter((unitID) => {

		// Filter out not matching unit IDs
		if (choice.unit && !choice.unit.has(unitID)) {
			return false;
		}

		const unit = this.units[unitID];

		// Filter out not matching countries
		if (choice.country && !choice.country.has(unit.country)) {
			return false;
		}

		// Filter out units without tasks
		if (!unit.tasks.length) {
			return false;
		}

		// Filter out not matching airfields
		if (choice.airfield && !choice.airfield.has(unit.airfield)) {
			return false;
		}

		// Allow only units with matching tasks
		if (choice.task) {

			let hasValidTask = false;

			for (const task of unit.tasks) {

				if (choice.task.has(task.id)) {

					hasValidTask = true;
					break;
				}
			}

			if (!hasValidTask) {
				return false;
			}
		}

		// Allow only units with matching planes
		if (choice.plane) {

			let hasValidPlane = false;

			for (const planeID of unit.planes) {

				if (choice.plane.has(planeID)) {

					hasValidPlane = true;
					break;
				}
			}

			if (!hasValidPlane) {
				return false;
			}
		}

		return true;
	}))];

	const flightParams = {
		player: true,
		state: params.state,
		unit: unit.id
	};

	if (choice.task) {

		// Find matching unit task choice
		for (const task of rand.shuffle(unit.tasks)) {

			if (!choice.task.has(task.id)) {
				continue;
			}

			flightParams.task = task.id;
			break;
		}
	}

	// FIXME: Make a number of active and shedulled flights
	do {

		try {
			flight = makeFlight.call(this, flightParams);
		}
		catch (error) {

			if (Array.isArray(error)) {
				log.W.apply(log, error);
			}
			else {
				throw error;
			}
		}
	}
	while (!flight);

	// Add flight to task force
	force.push(flight);
	this.forces.push(force);

	// Set player flight info references
	if (flight.player) {

		const player = this.player = Object.create(null);

		player.force = force;
		player.flight = flight;
		player.plane = flight.player.plane;
		player.item = flight.player.item;

		// Find player element
		for (const element of flight.elements) {

			if (element.player) {

				player.element = element;
				break;
			}
		}

		// Log player flight info
		const logData = ["Flight:"];

		// Flight unit name
		const unit = this.units[player.flight.unit];
		let unitName = unit.name;

		if (unit.suffix) {
			unitName += " " + unit.suffix;
		}

		if (unit.alias) {
			unitName += " “" + unit.alias + "”";
		}

		logData.push(unitName);

		// Flight formation and state (for player element)
		const formation = player.flight.formation;
		let formationID = formation.id;

		if (!formationID) {
			formationID = formation.elements.join(":");
		}

		logData.push({
			formation: formationID,
			state: player.element.state
		});

		log.I.apply(log, logData);
	}
};