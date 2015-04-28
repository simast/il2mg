/** @copyright Simas Toleikis, 2015 */
"use strict";

// Make mission flight elements
module.exports = function makeFlightElements(flight) {

	var rand = this.rand;
	var elements = flight.elements = [];
	var planeNumber = 0;
	var elementsNumber = 1;
	
	// TODO: Add support for more than one flight element
	for (var e = 0; e < 1; e++) {
		
		var element = [];
		
		// TODO: Elements can be mixed from the same unit group and plane group
		var unit = element.unit = this.unitsByID[flight.unit];
		
		rand.shuffle(unit.planes);
		
		// Pick available and required number of mission planes
		for (var i = 0; i < flight.mission.planes; i++) {
	
			// TODO: Pick planes required by mission type
			var plane = unit.planes.shift();
	
			if (!plane) {
				break;
			}
			
			planeNumber++;
			
			element.push({
				plane: plane,
				number: planeNumber
			});
		}
		
		elements.push(element);
	}
	
	// Number of planes in all flight elements
	flight.planes = planeNumber;
	
	// The first plane of the leading element is the flight leader plane
	// TODO: Let leaders pick the best plane available
	if (flight.planes) {
		flight.leader = elements[0][0];
	}
};