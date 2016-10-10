/** @copyright Simas Toleikis, 2015 */
"use strict";

const {Vector} = require("sylvester");
const {planAction} = require("../data");
const makeFlightFuel = require("./flight.fuel");

// Minimum and maximum distance from the border for offmap start/end position
// NOTE: This is only used for player flight!
const MIN_DISTANCE_BORDER = 3000; // 3 km
const MAX_DISTANCE_BORDER = 4000; // 4 km

// Minimum distance required between offmap star/end position and the next point
const MIN_NEXT_POINT_DISTANCE = 25000; // 25 km

// Make offmap flight bounds
module.exports = function makeFlightOffmap(flight) {
	
	const plan = flight.plan;
	let startPosition;
	let endPosition;
	
	for (const action of plan) {
		
		// Apply further offmap bounds check only for "fly" actions
		if (action.type !== planAction.FLY) {
			continue;
		}
		
		const route = action.route;
		
		if (!startPosition) {
			startPosition = plan.start.position;
		}
		
		endPosition = route[route.length - 1].position;
		
		// Adjust route start
		if (this.isOffmap(startPosition)) {
			adjustOffmapRouteBounds.call(this, flight, action, true, startPosition);
		}
		
		// Adjust route end
		if (this.isOffmap(endPosition)) {
			adjustOffmapRouteBounds.call(this, flight, action, false, startPosition);
		}
		
		startPosition = endPosition;
	}
};

// Adjust offmap fly action route for current map bounds
function adjustOffmapRouteBounds(flight, action, isForward, startPosition) {
	
	// FIXME: The iteration code below is way too complicated as a result of
	// trying to iterate in both forward and backwards directions. Also, the fact
	// startPosition is not part of the route array complicates things even more.
	// Consider refactoring this to a more readable and understandable format.
	
	const rand = this.rand;
	const plan = flight.plan;
	const route = action.route;
	const startAction = plan.start;
	const isPlayerFlight = Boolean(flight.player);
	let i = isForward ? 0 : route.length - 1;
	let prevPosition = isForward ? startPosition : route[i].position;
	let offmapDistance = 0;
	
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
			
			const adjustDistance = Vector.create(prevPosition).distanceFrom(
				Vector.create(nextPoint.position)
			);
			
			offmapDistance += adjustDistance;
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
			
			// NOTE: Rounding as the border intersection point may still result in
			// an offmap vector (due to Sylvester precision).
			offmapVector = offmapVector.round();
			
			const offmapPosition = prevPosition = offmapVector.elements;
			const adjustDistance = fromVector.distanceFrom(offmapVector);
			
			offmapDistance += adjustDistance;
			
			// Set offmap route start/end position
			if (isForward) {
				startAction.position = offmapPosition;
			}
			else {
				
				point.position = offmapPosition;
				
				// End flight action on map border/edge
				plan.push({
					type: planAction.END,
					position: offmapPosition
				});
			}
			
			break;
		}
		
		isForward ? i++ : i--;
	}
	
	if (!offmapDistance) {
		return;
	}
	
	if (isForward) {
		
		// Use flight fuel for virtual offmap travel distance
		makeFlightFuel.call(this, flight, offmapDistance);
		
		// Transfer used offmap state
		// TODO: Add "delay" for start action if necessary
		if (action.state && !startAction.state) {
			
			// Find remaining route distance
			let routeDistance = 0;
			prevPosition = plan.start.position;
			
			for (const {position} of route) {
				
				routeDistance += Vector.create(prevPosition).distanceFrom(
					Vector.create(position)
				);
				
				prevPosition = position;
			}
			
			const totalDistance = offmapDistance + routeDistance;
			const transferState = action.state * (offmapDistance / totalDistance);
			
			startAction.state = transferState;
			action.state -= transferState;
		}
	}
}