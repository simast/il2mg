/** @copyright Simas Toleikis, 2015 */
"use strict";

// Flight make parts
var makeFlight = require("./flight");

// Generate tasks
module.exports = function makeTasks() {
	
	var rand = this.rand;
	var player = this.player;
	var task = [];
	var unit;

	this.tasks = [];

	// Use requested player unit
	if (player.unit) {
		unit = player.unit;
	}
	// Pick a random unit
	else {
		unit = rand.pick(Object.keys(this.unitsByID));
	}
	
	// TODO: Make a number of active and shedulled flights
	var flight = makeFlight.call(this, {
		player: true,
		state: player.state,
		unit: unit,
		mission: {
			type: "training",
			planes: [2, 2],
			payload: "bombs"
		}
	});
	
	if (flight) {
		
		// Add flight to task hierarchy
		task.push(flight);
		this.tasks.push(task);
		
		// Set player flight and task references
		if (flight.player) {
			
			player.flight = flight;
			player.task = task;
		}
	}
};