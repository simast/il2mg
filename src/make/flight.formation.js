/** @copyright Simas Toleikis, 2015 */
"use strict";

// Make mission flight formation
module.exports = function makeFlightFormation(flight) {

	const rand = this.rand;
	const task = this.tasks[flight.task];
	const unit = this.units[flight.unit];
	const formations = this.formations[flight.country];
	let formation;
	
	// List of valid (assigned) plane IDs to use for flight formation
	let validPlanes = [];
	
	// Make sure to pick planes from unit plane inventory at random
	rand.shuffle(unit.planes);
	
	// Find a first (random) matching plane formation required by the task and
	// which this unit can satisfy with its current plane inventory.
	for (let planeType of rand.shuffle(Object.keys(task.planes))) {
		
		// FIXME: If the unit had an index of number of planes available by plane
		// type value - we could optimize and get rid of a couple of iterations.
		
		let taskFormations = task.planes[planeType];
		const invalidFormations = Object.create(null);
		
		// Support for a single value formation type
		if (!Array.isArray(taskFormations)) {
			taskFormations = [taskFormations];
		}
		
		// Check formations in random order
		for (let taskFormation of rand.shuffle(taskFormations)) {
			
			// Ignore known invalid formations (when they are repeated for distribution)
			if (invalidFormations[taskFormation]) {
				continue;
			}
			
			const checkFormations = Object.create(null);
			let planesRequired;
			
			// Basic flight formation (with number of max planes specified)
			if (typeof taskFormation === "number") {
				checkFormations[taskFormation] = taskFormation;
			}
			// Advanced flight formation
			else {
				
				let formationAdvanced = formations[taskFormation];
				
				// Formation is not valid (because of from/to filter paramaters for example)
				if (!formationAdvanced) {
					
					invalidFormations[formationAdvanced] = true;
					continue;
				}

				// Check only a single formation (not a group)
				if (!Array.isArray(formationAdvanced)) {
					formationAdvanced = [formationAdvanced.id];
				}
				
				// Collect all formation types and their required plane counts
				for (let formationType of rand.shuffle(formationAdvanced)) {
					
					planesRequired = 0;
					
					for (let elementPlanesRequired of formations[formationType].planes) {
						planesRequired += elementPlanesRequired;
					}
					
					checkFormations[formationType] = planesRequired;
				}
			}
			
			// Validate formation required plane count against available unit inventory
			for (let formationType in checkFormations) {
				
				const validPlanesByGroup = Object.create(null);
				
				validPlanes.length = 0;
				planesRequired = checkFormations[formationType];
				
				// Simple formation is identified by an integer max plane number
				const isSimpleFormation = !isNaN(parseInt(formationType, 10));
				
				for (let planeID of unit.planes) {
					
					const plane = this.planes[planeID];
					
					// Check for plane to be of the required type
					if (Array.isArray(plane.type) && plane.type.indexOf(planeType) >= 0) {
						
						let validPlanesGroup = validPlanesByGroup[plane.group];
						
						if (!validPlanesGroup) {
							validPlanesGroup = validPlanesByGroup[plane.group] = [];
						}
						
						validPlanesGroup.push(planeID);
						
						// Found a group of planes with all required plane types
						if (validPlanesGroup.length >= planesRequired) {
							
							validPlanes = validPlanesGroup;
							break;
						}
					}
				}
				
				// NOTE: A basic (numeric) formation type does not strictly require the number
				// of planes specified, but rather enforces a maximum of planes in a flight.
				if (isSimpleFormation && !validPlanes.length) {
					
					const validPlaneGroups = Object.keys(validPlanesByGroup);
					
					// Use a random group of valid planes for simple numeric formations
					if (validPlaneGroups.length) {
						validPlanes = validPlanesByGroup[rand.pick(validPlaneGroups)];
					}
				}
				
				// Set found matching formation
				if (validPlanes.length > 0 && (isSimpleFormation || validPlanes.length >= planesRequired)) {
					
					// Basic formation type
					if (isSimpleFormation) {

						formation = {
							planes: [validPlanes.length]
						};
					}
					// Advanced formation type
					else {
						formation = formations[formationType];
					}
					
					break;
				}
			}
			
			if (formation) {
				break;
			}
			
			invalidFormations[taskFormation] = true;
		}
		
		if (formation) {
			break;
		}
	}
	
	// Could not match unit to any of the required formations
	if (!formation) {
		throw ["No valid flight formation!", {unit: unit.id, task: flight.task}];
	}
	
	flight.elements = [];
	flight.formation = formation;
	flight.planes = 0; // Number of planes in all flight elements
	
	// Create requested number of flight elements
	formation.planes.forEach(function(planesInElement) {
		
		const element = [];
		
		// Pick available and required number of mission planes
		for (let p = 0; p < planesInElement; p++) {
			
			const planeID = validPlanes.shift();
			
			// Remove plane from unit plane inventory
			// TODO: Restore planes to inventory after the flight is finished
			unit.planes.splice(unit.planes.indexOf(planeID), 1);
			
			const plane = {
				plane: planeID
			};
			
			element.push(plane);
			
			// The first plane of the leading element is the flight leader plane
			// TODO: Let leaders pick the best plane available?
			if (!flight.leader) {
				flight.leader = plane;
			}
			
			flight.planes++;
		}
		
		// Inherit element state from parent flight
		element.state = flight.state;
		
		flight.elements.push(element);
		
	}, this);
};