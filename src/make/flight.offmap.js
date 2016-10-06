/** @copyright Simas Toleikis, 2015 */
"use strict";

const {Vector} = require("sylvester");
const {planAction} = require("../data");

// Minimum and maximum distance from the border for offmap start/end position
// NOTE: This is only used for player flight!
const MIN_DISTANCE_BORDER = 3000; // 3 km
const MAX_DISTANCE_BORDER = 4000; // 4 km

// Minimum distance required between offmap star/end position and the next point
const MIN_NEXT_POINT_DISTANCE = 25000; // 25 km

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
	const isPlayerFlight = Boolean(flight.player);
	let i = isForward ? 0 : route.length - 1;
	let prevPosition = isForward ? startPosition : route[i].position;
	
	while (route[i]) {
		
		const point = route[i];
		const nextPoint = route[isForward ? i : i - 1];
		const isPointOffmap = this.isOffmap(point.position);
		const isNextPointOffmap = nextPoint && this.isOffmap(nextPoint.position);
		
		// Throw away not needed offmap route points
		if (isPointOffmap && (isForward || isNextPointOffmap)) {
			
			route.splice(i, 1);
			
			if (isForward) {
				i--;
			}
			
			prevPosition = nextPoint.position;
		}
		// Adjust start/end route point to current map bounds
		else {
			
			const fromPosition = prevPosition;
			const toPosition = nextPoint ? nextPoint.position : startPosition;
			const fromVector = Vector.create(fromPosition);
			const toVector = Vector.create(toPosition);
			const {
				intersectVector,
				borderPlane
			} = this.getMapIntersection(fromVector, toVector);
			
			let offmapVector = intersectVector;
			
			// Move offmap border start position slightly inside the map to
			// prevent player from getting the "Warning: turn around!" message.
			if (isPlayerFlight && isForward) {
				
				offmapVector = toVector
					.subtract(intersectVector)
					.toUnitVector()
					.multiply(rand.real(MIN_DISTANCE_BORDER, MAX_DISTANCE_BORDER))
					.add(intersectVector);
				
				// Also make sure the distance from border to start offmap position
				// is at least minimum required (this might happen with routes crossing
				// map border on a very sharp angle).
				if (borderPlane.distanceFrom(offmapVector) < MIN_DISTANCE_BORDER) {
					
					const borderVector = borderPlane.pointClosestTo(offmapVector);
					
					offmapVector = offmapVector
						.subtract(borderVector)
						.toUnitVector()
						.multiply(MIN_DISTANCE_BORDER)
						.add(borderVector);
				}
			}
			
			// Throw away next point if its too close to offmap start/stop position
			if (nextPoint && (!isForward || (isForward && route.length > 1))) {
				
				const distanceToOffmap = offmapVector.distanceFrom(
					Vector.create(nextPoint.position)
				);
				
				if (distanceToOffmap < MIN_NEXT_POINT_DISTANCE) {
					route.splice(route.indexOf(nextPoint), 1);
				}
			}
			
			const offmapPosition = offmapVector.round().elements;
			
			// Set offmap route start/end position and orientation
			if (isForward) {
				
				const startAction = flight.plan.start;
				
				startAction.position = offmapPosition;
				
				// TODO: Set orientation for start action
			}
			else {
				
				point.position = offmapPosition;
				point.end = true;
			}
			
			break;
		}
		
		isForward ? i++ : i--;
	}
}