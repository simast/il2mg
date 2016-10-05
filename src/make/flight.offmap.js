/** @copyright Simas Toleikis, 2015 */
"use strict";

const {planAction} = require("../data");

// Make offmap flight (adjust flight plan for current state and offmap activity)
module.exports = function makeFlightOffmap(flight) {
	
	const plan = flight.plan;
	const startAction = plan.start;
	let startPosition;
	let endPosition;
	
	// TODO: Adjust "fly" actions to fit current map area.
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
		if (this.isOffmapPoint(startPosition[0], startPosition[2])) {
			adjustOffmapRouteBounds.call(this, flight, route, true, startPosition);
		}
		
		// Adjust route end
		if (this.isOffmapPoint(endPosition[0], endPosition[2])) {
			adjustOffmapRouteBounds.call(this, flight, route, false, startPosition);
		}
		
		startPosition = endPosition;
	}
};

// Adjust offmap flight route for current map bounds
function adjustOffmapRouteBounds(flight, route, isForward, startPosition) {
	
	const plan = flight.plan;
	let isAdjusted = false;
	let i = isForward ? 0 : route.length - 1;
	let prevPosition = isForward ? startPosition : route[i].position;
	
	console.log(route);
	
	while (route[i]) {
		
		const point = route[i];
		const nextPoint = route[isForward ? i + 1 : i - 1];
		
		if (!isAdjusted) {
		
			const isPointOffmap = this.isOffmapPoint(point.position[0], point.position[2]);
			const isNextPointOffmap = nextPoint && this.isOffmapPoint(
				nextPoint.position[0],
				nextPoint.position[2]
			);
			
			// Throw away not needed offmap route points
			if (isPointOffmap && (isForward || isNextPointOffmap)) {
				
				route.splice(i, 1);
				
				if (isForward) {
					i--;
				}
				
				console.log("throw away point");
				
				prevPosition = isForward ? point.position : nextPoint.position;
			}
			// Adjust start/end route point to current map bounds
			else {
				
				console.log("adjust point");
				
				isAdjusted = true;
				
				const fromPosition = prevPosition;
				let toPosition = point.position;
				
				if (!isForward) {
					toPosition = nextPoint ? nextPoint.position : startPosition;
				}
				
				console.log(fromPosition);
				console.log(toPosition);
				
				// FIXME:
				if (isForward) {
					plan.start.position = toPosition;
				}
			}
		}
		
		isForward ? i++ : i--;
	}
	
	console.log(route);
}