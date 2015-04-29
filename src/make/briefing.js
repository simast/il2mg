/** @copyright Simas Toleikis, 2015 */
"use strict";

// Generate mission briefing
module.exports = function makeBriefing() {

	var options = this.items.Options;

	var briefing = [];

	// Date and time
	briefing.push(makeBriefingDateAndTime.call(this));

	// TODO: General mission text (summarry)
	briefing.push("Maecenas diam sem, aliquam at scelerisque quis, porttitor quis massa. Ut imperdiet hendrerit pharetra. Suspendisse vel eros vel velit venenatis pretium. Sed commodo sollicitudin rhoncus.");
	
	// Flight and pilot info
	briefing.push(makeBriefingFlight.call(this));

	// TODO: Location info
	// TODO: Task/objective info
	// TODO: Payload info
	// TODO: Battle situation
	// TODO: Weather report

	// TODO: Flight plan output
	briefing.push("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam faucibus ipsum vitae sapien tincidunt, sed venenatis enim semper. Nunc quis mi nulla.");
	briefing.push("Aliquam eu diam ac enim feugiat eleifend. Pellentesque posuere blandit libero at porttitor. Phasellus euismod erat pulvinar eros posuere viverra. Donec blandit orci ac ipsum elementum, eu pellentesque felis finibus. Vivamus malesuada nibh eu nibh congue, hendrerit sollicitudin nisi faucibus.");
	briefing.push("Duis sit amet euismod leo. Nulla ac augue ut diam egestas finibus. Etiam ut hendrerit diam. Suspendisse rutrum nunc purus. Mauris tempor congue mi, quis congue tortor fringilla id.");
	briefing.push("Pellentesque pharetra vulputate libero, sit amet faucibus felis blandit faucibus.");

	options.setDescription(this.getLC(briefing.join("<br><br>")));
};

// Make mission briefing date and time output
function makeBriefingDateAndTime() {

	var time = this.time;
	var output = "";

	output += this.date.format("MMMM Do, YYYY") + "<br>";
	output += '<font size="14">';
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
			
			// Generic formation name
			output += "Flight";
		}
		else {
			output += "<i>" + formation + "</i>";
		}
		
		// Unit name
		// TODO: Show all units if elements are from different units
		output += ' of <font color="#FFFFFF">' + unit.name + "</font>";
		
		// Unit alias
		if (unit.alias) {
			output += " <i>“" + unit.alias + "”</i>";
		}
		
		output += ",<br><br>";

		element.forEach(function(plane) {

			var pilot = plane.pilot;
			
			// Pilot and plane info
			output += "\t" + plane.number + ". ";
			output += '<font size="16"><i>' + pilot.rank[1] + "</i></font> ";
			output += pilot.name[0] + " " + pilot.name[1] + ', <font size="16"><i>';
			output += this.planesByID[plane.plane].name;
			output += "</i></font><br>";

		}, this);

		// Element separator
		if ((elementIndex + 1) !== flight.elements.length) {
			output += '<font size="8"></font><br>';
		}
		
		// Flight callsign
		output += "<br>\tCallsign <i>“" + flight.callsign[1] + "”</i>.";
		
	}, this);
	
	return output;
}