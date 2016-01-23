/** @copyright Simas Toleikis, 2015 */
"use strict";

// Flight make parts
const makeFlight = require("./flight");

// Generate mission task forces
module.exports = function makeForces() {

	const rand = this.rand;
	const player = this.player;
	const force = [];
	let flight;

	this.forces = [];

	// Select player unit from a weighted unit list (by plane count)
	const unit = this.units[rand.pick(this.unitsWeighted.filter((unitID) => {
		return (player.units.indexOf(unitID) !== -1 && this.units[unitID].tasks.length);
	}))];

	// FIXME: Make a number of active and shedulled flights
	do {

		try {

			flight = makeFlight.call(this, {
				player: true,
				state: player.state,
				unit: unit.id
			});
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

	// Set player flight and task force references
	if (flight.player) {

		player.force = force;
		player.flight = flight;

		// Find player element
		for (const element of flight.elements) {

			if (element.player) {

				player.element = element;
				break;
			}
		}
	}
};