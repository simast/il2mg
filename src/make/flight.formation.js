/** @copyright Simas Toleikis, 2015 */
"use strict";

// Make mission flight formation
module.exports = function makeFlightFormation(flight) {

	var rand = this.rand;
	var task = DATA.tasks[flight.task];
	var unit = this.unitsByID[flight.unit];
	var formations = this.formations[flight.country];
	var formation;
	
	// List of valid (assigned) plane IDs to use for flight formation
	var validPlanes = [];
	
	// Make sure to pick planes from unit plane inventory at random
	rand.shuffle(unit.planes);
	
	// Find a first (random) matching plane formation required by the task and
	// which this unit can satisfy with its current plane inventory.
	for (var planeType of rand.shuffle(Object.keys(task.planes))) {
		
		// FIXME: If the unit had an index of number of planes available by plane
		// type value - we could optimize and get rid of a couple of iterations.
		
		var taskFormations = task.planes[planeType];
		var invalidFormations = Object.create(null);
		
		// Support for a single value formation type
		if (!Array.isArray(taskFormations)) {
			taskFormations = [taskFormations];
		}
		
		// Check formations in random order
		for (var taskFormation of rand.shuffle(taskFormations)) {
			
			// Ignore known invalid formations (when they are repeated for distribution)
			if (invalidFormations[taskFormation]) {
				continue;
			}
			
			var checkFormations = Object.create(null);
			var formationType;
			var planesRequired;
			
			// Basic flight formation (with number of max planes specified)
			if (typeof taskFormation === "number") {
				checkFormations[taskFormation] = taskFormation;
			}
			// Advanced flight formation
			else {
				
				var formationAdvanced = formations[taskFormation];
				
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
				for (formationType of rand.shuffle(formationAdvanced)) {
					
					planesRequired = 0;
					
					for (var elementPlanesRequired of formations[formationType].planes) {
						planesRequired += elementPlanesRequired;
					}
					
					checkFormations[formationType] = planesRequired;
				}
			}
			
			// Validate formation required plane count against available unit inventory
			for (formationType in checkFormations) {
				
				validPlanes.length = 0;
				planesRequired = checkFormations[formationType];
				
				// Simple formation is identified by an integer max plane number
				var isSimpleFormation = !isNaN(parseInt(formationType, 10));
				
				for (var planeID of unit.planes) {
					
					var plane = this.planesByID[planeID];
					
					// Check for plane to be of the required type
					if (Array.isArray(plane.type) && plane.type.indexOf(planeType) >= 0) {
						validPlanes.push(planeID);
					}
					
					// Found all required plane types
					if (validPlanes.length >= planesRequired) {
						break;
					}
				}
				
				// Found matching formation
				// NOTE: A basic (numeric) formation type does not strictly require the number
				// of planes specified, but rather enforces a maximum of planes in a flight.
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
		
		var element = [];
		
		// Pick available and required number of mission planes
		for (var p = 0; p < planesInElement; p++) {
	
			// TODO: Use same plane for element (don't mix Bf 109 F-4s wth G-2s for example)
			var planeID = validPlanes.shift();
			
			// Remove plane from unit plane inventory
			// TODO: Restore planes to inventory after the flight is finished
			unit.planes.splice(unit.planes.indexOf(planeID), 1);
			
			var plane = {
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