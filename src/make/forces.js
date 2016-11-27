/** @copyright Simas Toleikis, 2015 */
"use strict";

const log = require("../log");
const makeFlight = require("./flight");

// Generate mission task forces
module.exports = function makeForces() {

	// Make player force
	makePlayerForce.call(this);

	// FIXME: Make some random AI forces for testing
	for (let i = 0; i < 10; i++) {
		makeForce.call(this, {});
	}
};

// Make a new task force
function makeForce({player = false, choice = {}, state = 0}) {

	const {rand} = this;
	const force = [];
	const flightParams = {};
	const unit = chooseFlightUnit.call(this, choice);
	let flight;

	// Make player flight and task force
	if (player) {
		flightParams.player = true;
	}

	flightParams.unit = unit.id;
	flightParams.state = state;

	if (choice.task) {

		// Find matching unit task choice
		for (const task of rand.shuffle(unit.tasks)) {

			if (choice.task.has(task.id)) {

				flightParams.task = task.id;
				break;
			}
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

	return force;
}

// Make player task force
function makePlayerForce() {

	const {choice, params} = this;

	// Create player task force
	const force = makeForce.call(this, {
		player: true,
		choice,
		state: params.state
	});

	const [flight] = force;

	// Set player flight info references
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

	// Log flight unit name
	const unit = this.units[player.flight.unit];
	let unitName = unit.name;

	if (unit.suffix) {
		unitName += " " + unit.suffix;
	}

	if (unit.alias) {
		unitName += " “" + unit.alias + "”";
	}

	logData.push(unitName);

	// Log flight formation and state (for player element)
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

// Choose a valid flight unit based on choice data
function chooseFlightUnit(choice) {

	const {rand} = this;
	const validUnits = new Set();

	// Filter all valid units
	for (const unitID in this.units) {

		// Filter out not matching unit IDs
		if (choice.unit && !choice.unit.has(unitID)) {
			continue;
		}

		const unit = this.units[unitID];

		// Filter out unit groups
		if (Array.isArray(unit)) {
			continue;
		}

		// Filter out units without tasks
		if (!unit.tasks.length) {
			continue;
		}

		// Filter out not matching countries
		if (choice.country && !choice.country.has(unit.country)) {
			continue;
		}

		// Filter out not matching airfields
		if (choice.airfield && !choice.airfield.has(unit.airfield)) {
			continue;
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
				continue;
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
				continue;
			}
		}

		validUnits.add(unitID);
	}

	if (!validUnits.size) {
		return;
	}

	// FIXME: Support unit availability
	// FIXME: Make a more efficient selection (not filtering weighted unit list)

	// Select a matching unit (from a weighted list)
	return this.units[rand.pick(this.unitsWeighted.filter((unitID) => {
		return validUnits.has(unitID);
	}))];
}