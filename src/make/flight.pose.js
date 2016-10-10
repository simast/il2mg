/** @copyright Simas Toleikis, 2016 */
"use strict";

const {Vector} = require("sylvester");
const {planAction} = require("../data");

// Minimum and maximum pitch angle (for pose orientation)
const MIN_PITCH_ANGLE = -15;
const MAX_PITCH_ANGLE = +15;

// Make flight air start pose (position and orientation based on formation)
module.exports = function makeFlightPose(flight, fromPosition, toPosition) {
	
	let spawnPosition;
	let spawnOrientation;
	let spawnVector;
	
	for (const element of flight.elements) {
		
		// Apply pose only to elements with air start
		if (typeof element.state !== "number") {
			continue;
		}
		
		const rand = this.rand;
		
		// Find initial spawn position
		if (!spawnPosition) {
			
			spawnPosition = fromPosition;
			const airfieldPosition = this.airfields[flight.airfield].position;
			
			// Use a random spawn point above airfield
			if (!spawnPosition || spawnPosition === airfieldPosition) {
				
				spawnPosition = [
					airfieldPosition[0] + rand.real(-400, 400, true),
					airfieldPosition[1] + rand.real(250, 350, true),
					airfieldPosition[2] + rand.real(-400, 400, true)
				];
			}
		}
		
		// Try to use next route point position (for orientation)
		if (!toPosition && typeof flight.state === "number") {

			for (const action of flight.plan) {
				
				if (action.type === planAction.FLY) {
					
					toPosition = action.route[0].position;
					break;
				}
			}
		}
		
		// Use a random orientation target position
		if (!toPosition) {
			
			toPosition = [
				spawnPosition[0] + rand.real(-1, 1, true),
				spawnPosition[1],
				spawnPosition[2] + rand.real(-1, 1, true)
			];
		}
		
		// Build orientation vector
		if (!spawnOrientation) {
			
			const diffX = toPosition[0] - spawnPosition[0];
			const diffY = toPosition[1] - spawnPosition[1];
			const diffZ = toPosition[2] - spawnPosition[2];
			
			let orientationY = Math.atan2(diffZ, diffX);
			let orientationZ = Math.atan2(
				diffY,
				Math.sqrt(diffZ * diffZ + diffX * diffX)
			);
			
			orientationY = orientationY * (180 / Math.PI);
			orientationZ = orientationZ * (180 / Math.PI);
			
			if (orientationY < 0) {
				orientationY += 360;
			}
			
			// Apply pitch angle limits
			orientationZ = Math.max(orientationZ, MIN_PITCH_ANGLE);
			orientationZ = Math.min(orientationZ, MAX_PITCH_ANGLE);
			
			if (orientationZ < 0) {
				orientationZ += 360;
			}
			
			spawnOrientation = [0, orientationY, orientationZ];
			
			// Inverted orientation vector (used for formation positioning)
			spawnVector = Vector.create([diffX, diffY, diffZ])
				.toUnitVector()
				.multiply(-1);
		}
		
		// Apply air start orientation and position for each plane
		for (const plane of element) {
			
			const isElementLeader = (plane === element[0]);
			const planeItem = plane.item;
			
			if (!isElementLeader) {
				
				spawnPosition = Vector.create(spawnPosition)
					.add(spawnVector.multiply(80))
					.elements;
			}
			
			planeItem.setOrientation(spawnOrientation);
			planeItem.setPosition(spawnPosition);
		}
		
		// FIXME:
		spawnPosition = Vector.create(spawnPosition)
			.add(spawnVector.multiply(200))
			.elements;
	}
};