/** @copyright Simas Toleikis, 2015 */
"use strict";

// Flight make parts
var makeFlight = require("./flight");

// Generate tasks
module.exports = function makeTasks() {
	
	var rand = this.rand;
	var player = this.player;
	var task = [];
	var flight;

	this.tasks = [];
	
	// FIXME: Make a number of active and shedulled flights
	do {
		
		try {
			
			flight = makeFlight.call(this, {
				player: true,
				state: player.state,
				unit: rand.pick(Object.keys(this.unitsByID)),
				task: rand.pick(Object.keys(DATA.tasks))
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
	
	// Add flight to task hierarchy
	task.push(flight);
	this.tasks.push(task);
	
	// Set player flight and task references
	if (flight.player) {
		
		player.flight = flight;
		player.task = task;
	}
};