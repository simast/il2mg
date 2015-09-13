/** @copyright Simas Toleikis, 2015 */
"use strict";

// Flight make parts
var makeFlight = require("./flight");

// Generate mission task forces
module.exports = function makeForces() {
	
	var rand = this.rand;
	var player = this.player;
	var force = [];
	var flight;

	this.forces = [];
	
	// FIXME: Make a number of active and shedulled flights
	do {
		
		try {
			
			flight = makeFlight.call(this, {
				player: true,
				state: player.state,
				unit: rand.pick(player.units),
				task: rand.pick(Object.keys(this.tasks))
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
		for (var element of flight.elements) {
	
			if (element.player) {
	
				player.element = element;
				break;
			}
		}
	}
};