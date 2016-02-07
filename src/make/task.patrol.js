/** @copyright Simas Toleikis, 2016 */
"use strict";

const data = require("../data");
const Location = require("./locations").Location;
const makeFlightRoute = require("./flight.route");

// Data constants
const planAction = data.planAction;
const territory = data.territory;
const gridSize = data.gridSize;

// Make mission defensive patrol task
module.exports = function makeTaskPatrol(flight) {
	
	const rand = this.rand;
	const airfield = this.airfields[flight.airfield];
	const fronts = this.locations.territories[territory.FRONT];
	let foundFronts;
	let from = airfield.position;
	const homeLocation = new Location(from[0], from[2]);
	
	// 50% chance to use nearby fronts for patrol area
	if (rand.bool(0.5)) {
		
		// NOTE: Get all front points over ~50 Km front. On average there will be
		// three front points per grid size (one on the front line and two nearby).
		const maxPoints = Math.max(Math.round((50000 * 3) / gridSize), 2);
		
		foundFronts = fronts.findNear(homeLocation, maxPoints);
	}
	// 25% chance to select patrol area from all fronts
	else {
		foundFronts = fronts.findAll();
	}
	
	// TODO: Use offmap enemy reference points when front lines are not available
	
	// Make sure front point selection is randomized
	rand.shuffle(foundFronts);
	
	const route = [];
	let ingress;
	let egress;
	
	// Select two points for ingress/egress
	for (const location of foundFronts) {
		
		// Use first (random) ingress front location
		if (!ingress) {
			
			// TODO: Ignore front points outside 20% fuel range
			if (homeLocation.vector.distanceFrom(location.vector) > 100000) {
				continue;
			}
			
			ingress = location;
			continue;
		}
		
		egress = location;
		
		const egressDistance = ingress.vector.distanceFrom(location.vector);
		
		// Search for an egress location between 25 and 50 Km away from ingress
		if (egressDistance >= 25000 && egressDistance <= 50000) {
			break;
		}
	}
	
	for (const location of [ingress, egress]) {
		
		const options = {};
		
		// Hide route map lines for patrol area spots
		if (location !== ingress) {
			options.hidden = true;
		}
		// Mark route as ingress
		else {
			options.ingress = true;
		}
		
		const to = [
			rand.integer(location.x1, location.x2),
			1500, // TODO
			rand.integer(location.z1, location.z2)
		];
		
		const spots = makeFlightRoute.call(this, flight, from, to, options);
		
		route.push.apply(route, spots);
		from = spots.pop().point;
	}
	
	// Make final (back to the airfield) egress route
	route.push.apply(
		route,
		makeFlightRoute.call(this, flight, from, null, {egress: true})
	);
	
	// Add patrol task fly action
	flight.plan.push({
		type: planAction.FLY,
		route: route
	});
};