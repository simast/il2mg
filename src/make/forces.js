/** @copyright Simas Toleikis, 2015 */
"use strict";

const log = require("../log");
const makeFlight = require("./flight");

// Generate mission task forces
module.exports = function makeForces() {

	const rand = this.rand;
	const params = this.params;
	const force = [];
	let flight;

	this.forces = [];

	// Select player unit from a weighted unit list (by plane count)
	const unit = this.units[rand.pick(this.unitsWeighted.filter((unitID) => {
		return this.validChoices.has(unitID + "~" + this.units[unitID].airfield);
	}))];
	
	const flightParams = {
		player: true,
		state: params.state,
		unit: unit.id
	};
	
	if (params.task) {
		flightParams.task = params.task;
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
	}
};