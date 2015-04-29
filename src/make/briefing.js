/** @copyright Simas Toleikis, 2015 */
"use strict";

// Generate mission briefing
module.exports = function makeBriefing() {

	var options = this.items.Options;

	var briefing = [];

	// Date and time
	briefing.push(makeBriefingDateAndTime.call(this));
	
	// Flight and pilot info
	briefing.push(makeBriefingFlight.call(this));

	// TODO: Location info
	// TODO: Task/objective info
	// TODO: Payload info
	// TODO: Battle situation
	// TODO: Weather report

	options.setDescription(this.getLC(briefing.join("<br><br>")));
};

// Make mission briefing date and time output
function makeBriefingDateAndTime() {

	var time = this.time;
	var output = "";

	output += this.date.format("MMMM Do, YYYY") + "<br>";
	output += '<font size="13">';
	output += this.date.format("HH.mm") + " hrs";

	// Display time period names
	if (typeof this.time === "object") {

		var timePeriods = Object.keys(time);

		// Remove "day" as daylight will be indicated by other periods
		if (time.day) {
			timePeriods.splice(timePeriods.indexOf("day"), 1);
		}

		// Remove "night" when night-time is indicated as midnight
		if (time.midnight) {

			var nightIndex = timePeriods.indexOf("night");

			if (nightIndex >= 0) {
				timePeriods.splice(nightIndex, 1);
			}
		}

		// Remove "morning" when morning is indicated as sunrise
		if (time.sunrise) {

			var morningIndex = timePeriods.indexOf("morning");

			if (morningIndex >= 0) {
				timePeriods.splice(morningIndex, 1);
			}
		}

		// Remove "evening" when evening is indicated as sunset or dusk
		if (time.sunset || time.dusk) {

			var eveningIndex = timePeriods.indexOf("evening");

			if (eveningIndex >= 0) {
				timePeriods.splice(eveningIndex, 1);
			}
		}

		if (timePeriods.length) {
			output += ", " + timePeriods.join(", ");
		}
	}

	output += "</font>";

	return output;
}

// Make mission flight and pilot info output
function makeBriefingFlight() {
	
	var flight = this.flights.player;
	var output = "";
	
	flight.elements.forEach(function(element, elementIndex) {
		
		var unit = element.unit;
		var formation;
		
		// TODO: Move formation names to data files?
		
		// Germany formation names
		if (unit.country === 201) {
			
			if (flight.planes === 9) {
				formation = "Staffel";
			}
			else if (flight.planes === 4) {
				formation = "Schwarm";
			}
			else if (flight.planes === 3) {
				formation = "Kette";
			}
			else if (flight.planes === 2) {
				formation = "Rotte";
			}
		}
		// Soviet Union formation names
		else if (unit.country === 101) {

			if (flight.planes === 8 || flight.planes === 6) {
				formation = "Gruppa";
			}
			else if (flight.planes === 4 || flight.planes === 3) {
				formation = "Zveno";
			}
			else if (flight.planes === 2) {
				formation = "Para";
			}
		}
		
		// TODO: Italy formation names
		
		if (!formation) {
			
			// Use generic formation name
			output += "Flight";
		}
		else {
			output += "<i>" + formation + "</i> formation";
		}
		
		output += " of " + unit.name;
		
		if (unit.alias) {
			output += ' "' + unit.alias + '"';
		}
		
		output += "<br><br>";
		
		element.forEach(function(plane) {

			var pilot = plane.pilot;
			
			output += "\t" + plane.number + ". ";
			output += this.planesByID[plane.plane].name + " (";
			output += pilot.rank[1] + " ";
			output += pilot.name[0] + " " + pilot.name[1];
			output += ")<br>";
			
		}, this);
		
	}, this);
	
	return output;
}