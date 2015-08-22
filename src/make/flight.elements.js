/** @copyright Simas Toleikis, 2015 */
"use strict";

// Make mission flight elements
module.exports = function makeFlightElements(flight, formation) {

	var rand = this.rand;
	var elements = flight.elements = [];
	var planesCount = 0;
	
	// TODO: Use a formation with best match of available planes in the unit
	if (Array.isArray(formation)) {
		formation = rand.pick(formation);
	}
	
	// Use a simple flight formation (with number of planes specified)
	if (typeof formation === "number") {
		
		flight.formation = {
			planes: [formation]
		};
	}
	// Use a named flight formation
	else {
		
		var formations = this.formations[flight.country];
		
		// Resolve formation from formation group ID
		while (Array.isArray(formations[formation])) {
			formation = rand.pick(formations[formation]);
		}
		
		flight.formation = formations[formation];
	}
	
	// Create requested number of flight elements
	flight.formation.planes.forEach(function(planesInElement) {
		
		var element = [];

		// TODO: Allow elements to be mixed from the same unit group and plane group
		var unit = element.unit = this.unitsByID[flight.unit];
		
		rand.shuffle(unit.planes);
		
		// Pick available and required number of mission planes
		for (var p = 0; p < planesInElement; p++) {
	
			// TODO: Pick planes required by mission type
			// TODO: Use same plane for element (don't mix Bf 109 F-4s wth G-2s for example)
			var planeID = unit.planes.shift();

			if (!planeID) {
				break;
			}
			
			var plane = {
				plane: planeID
			};
			
			element.push(plane);
			
			// The first plane of the leading element is the flight leader plane
			// TODO: Let leaders pick the best plane available?
			if (!flight.leader) {
				flight.leader = plane;
			}
			
			planesCount++;
		}
		
		if (element.length) {
			
			// Inherit element state from parent flight
			element.state = flight.state;
			
			elements.push(element);
		}
		
	}, this);
	
	// Number of planes in all flight elements
	flight.planes = planesCount;
};