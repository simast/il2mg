/** @copyright Simas Toleikis, 2016 */
"use strict";

const {Vector, Line} = require("sylvester");
const {planAction} = require("../data");

// Minimum and maximum pitch angle (for pose orientation)
const MIN_PITCH_ANGLE = -15;
const MAX_PITCH_ANGLE = +15;

// Airfield spawn altitude and area radius constraints (in meters)
const AIRFIELD_SPAWN_MIN_ALT = 200;
const AIRFIELD_SPAWN_MAX_ALT = 350;
const AIRFIELD_SPAWN_RADIUS = 400;

// Make flight air start pose (position and orientation based on formation)
module.exports = function makeFlightPose(flight, fromPosition, toPosition) {
	
	let spawnPosition;
	let spawnOrientation;
	let spawnVector;
	let spawnRotationLine;
	
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
				
				const offsetX = rand.real(-AIRFIELD_SPAWN_RADIUS, AIRFIELD_SPAWN_RADIUS);
				const offsetY = rand.real(AIRFIELD_SPAWN_MIN_ALT, AIRFIELD_SPAWN_MAX_ALT);
				const offsetZ = rand.real(-AIRFIELD_SPAWN_RADIUS, AIRFIELD_SPAWN_RADIUS);
				
				spawnPosition = [
					airfieldPosition[0] + offsetX,
					airfieldPosition[1] + offsetY,
					airfieldPosition[2] + offsetZ
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
			
			let yaw = Math.atan2(diffZ, diffX);
			let pitch = Math.atan2(
				diffY,
				Math.sqrt(diffZ * diffZ + diffX * diffX)
			);
			
			yaw = yaw * (180 / Math.PI);
			pitch = pitch * (180 / Math.PI);
			
			if (yaw < 0) {
				yaw += 360;
			}
			
			// Apply pitch angle limits
			pitch = Math.max(pitch, MIN_PITCH_ANGLE);
			pitch = Math.min(pitch, MAX_PITCH_ANGLE);
			
			if (pitch < 0) {
				pitch += 360;
			}
			
			spawnOrientation = [0, yaw, pitch]; // Roll, Yaw, Pitch
			
			// Inverted orientation vector (used for formation positioning)
			spawnVector = Vector.create([diffX, diffY, diffZ])
				.toUnitVector()
				.multiply(-1);
			
			// Build a perpendicular spawn vector rotation axis line
			pitch = (pitch + 90) % 360;
			
			spawnRotationLine = Line.create(Vector.Zero(3), Vector.create([
				Math.cos(yaw * (Math.PI / 180)) * Math.cos(pitch * (Math.PI / 180)),
				Math.sin(pitch * (Math.PI / 180)),
				Math.sin(yaw * (Math.PI / 180)) * Math.cos(pitch * (Math.PI / 180))
			]));
		}
		
		// Apply air start orientation and position for each plane
		for (const plane of element) {
			
			const isElementLeader = (plane === element[0]);
			const planeItem = plane.item;
			
			// Set wingman position based on element formation
			if (!isElementLeader) {
				
				spawnPosition = Vector.create(spawnPosition)
					.add(spawnVector.multiply(80))
					.rotate(Math.PI / 2, spawnRotationLine) // FIXME
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