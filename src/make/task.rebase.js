/** @copyright Simas Toleikis, 2016 */
"use strict";

const data = require("../data");
const markMapArea = require("./task.cover").markMapArea;

// Flight make parts
const makeFlightRoute = require("./flight.route");
const makeAirfieldTaxi = require("./airfield.taxi");

// Data constants
const planAction = data.planAction;

// Make mission rebase task
module.exports = function makeTaskRebase(flight) {
	
	const rand = this.rand;
	const unit = this.units[flight.unit];
	const plan = flight.plan;
	const airfieldFrom = this.airfields[flight.airfield];
	const airfieldTo = this.airfields[rand.pick(unit.rebase)];
	const isPlayerFlight = Boolean(flight.player);
	const isPlayerFlightLeader = (flight.player === flight.leader);
	const debugFlights = Boolean(this.debug && this.debug.flights);
	
	// TODO: Set beacon to target airfield
	
	const route =	makeFlightRoute.call(
		this,
		flight,
		airfieldFrom.position,
		airfieldTo.id,
		{
			hidden: (isPlayerFlightLeader && !debugFlights),
			solid: true
		}
	);
	
	// Add rebase task fly action
	plan.push({
		type: planAction.FLY,
		route: route,
		visible: isPlayerFlight
	});
	
	let taxiRouteID;
	
	plan.land = true;
	
	// Add rebase task land action
	if (!airfieldTo.offmap) {
		
		// Pick a random existing target airfield taxi route
		if (airfieldTo.activeTaxiRoutes) {
			taxiRouteID = +rand.pick(Object.keys(airfieldTo.activeTaxiRoutes));
		}
		// Make a new taxi route on target airfield
		else if (airfieldTo.taxi) {
			
			taxiRouteID = +rand.pick(Object.keys(airfieldTo.taxi));
			makeAirfieldTaxi.call(this, airfieldTo, taxiRouteID);
		}
		
		plan.land = plan[plan.push({
			type: planAction.LAND,
			airfield: airfieldTo.id,
			taxi: taxiRouteID
		}) - 1];
	}
	
	// Mark target airfield area on the map
	if (!airfieldTo.offmap && isPlayerFlight) {
		
		markMapArea.call(
			this,
			flight,
			airfieldTo.position[0],
			airfieldTo.position[2],
			true
		);
	}
	
	console.log(airfieldFrom.id);
	console.log(airfieldTo.id);
	
	// Register target airfield location as flight target
	// flight.target = patrolPoints.slice();
};