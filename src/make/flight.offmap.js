/** @copyright Simas Toleikis, 2015 */
"use strict";

const {Vector} = require("sylvester");
const {planAction} = require("../data");

// Minimum and maximum distance from the border for offmap start/end position
// NOTE: This is only used for player flight!
const MIN_DISTANCE_BORDER = 3000; // 3 km
const MAX_DISTANCE_BORDER = 5000; // 5 km

// Make offmap flight (adjust flight plan for current state and offmap activity)
module.exports = function makeFlightOffmap(flight) {
	
	const plan = flight.plan;
	const startAction = plan.start;
	let startPosition;
	let endPosition;
	
	// TODO: Add "delay" and "state" values for start action if necessary.
	// TODO: Build virtual route points (for AI flights only)
	
	for (const action of plan) {
		
		// Apply further offmap bounds check only for "fly" actions
		if (action.type !== planAction.FLY) {
			continue;
		}
		
		const route = action.route;
		
		if (!startPosition) {
			startPosition = startAction.position;
		}
		
		endPosition = route[route.length - 1].position;
		
		// Adjust route start
		if (this.isOffmap(startPosition)) {
			adjustOffmapRouteBounds.call(this, flight, route, true, startPosition);
		}
		
		// Adjust route end
		if (this.isOffmap(endPosition)) {
			adjustOffmapRouteBounds.call(this, flight, route, false, startPosition);
		}
		
		startPosition = endPosition;
	}
};

// Adjust offmap flight route for current map bounds
function adjustOffmapRouteBounds(flight, route, isForward, startPosition) {
	
	const rand = this.rand;
	const plan = flight.plan;
	const isPlayerFlight = Boolean(flight.player);
	let i = isForward ? 0 : route.length - 1;
	let prevPosition = isForward ? startPosition : route[i].position;
	
	while (route[i]) {
		
		const point = route[i];
		const nextPoint = route[isForward ? i + 1 : i - 1];
		const isPointOffmap = this.isOffmap(point.position);
		const isNextPointOffmap = nextPoint && this.isOffmap(nextPoint.position);
		
		// Throw away not needed offmap route points
		if (isPointOffmap && (isForward || isNextPointOffmap)) {
			
			route.splice(i, 1);
			
			if (isForward) {
				i--;
			}
			
			prevPosition = isForward ? point.position : nextPoint.position;
		}
		// Adjust start/end route point to current map bounds
		else {
			
			const fromPosition = prevPosition;
			let toPosition = point.position;
			
			if (!isForward) {
				toPosition = nextPoint ? nextPoint.position : startPosition;
			}
			
			const fromVector = Vector.create(fromPosition);
			const toVector = Vector.create(toPosition);
			const {
				intersectVector,
				borderPlane
			} = this.getMapIntersection(fromVector, toVector);
			
			let offmapPosition = intersectVector.elements;
			
			// Move offmap border start/end position slightly inside the map to
			// prevent player from getting the "Warning: turn around!" message.
			if (isPlayerFlight) {
				
				let offmapVector = toVector
					.subtract(intersectVector)
					.toUnitVector()
					.multiply(rand.real(MIN_DISTANCE_BORDER, MAX_DISTANCE_BORDER))
					.add(intersectVector);
				
				// Also make sure the distance from border to start/end offmap position
				// is at least minimum required (this might happen with routes crossing
				// map border on a very sharp angle).
				for (;;) {
					
					const distanceToBorder = borderPlane.distanceFrom(offmapVector);
					
					if (distanceToBorder >= MIN_DISTANCE_BORDER) {
						break;
					}
					
					const borderVector = borderPlane.pointClosestTo(offmapVector);
					
					offmapVector = offmapVector
						.subtract(borderVector)
						.toUnitVector()
						.multiply(MIN_DISTANCE_BORDER)
						.add(borderVector);
				}
				
				offmapPosition = offmapVector.elements;
			}
			
			// Set offmap route start/end position and orientation
			if (isForward) {
				plan.start.position = offmapPosition;
			}
			else {
				point.position = offmapPosition;
			}
			
			break;
		}
		
		isForward ? i++ : i--;
	}
}