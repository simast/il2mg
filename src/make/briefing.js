/** @copyright Simas Toleikis, 2015 */
"use strict";

// Data constants
var planAction = DATA.planAction;
var briefingColor = DATA.briefingColor;

// Plan action briefing parts
var makeBriefingPlan = Object.create(null);

makeBriefingPlan[planAction.TAKEOFF] = require("./briefing.takeoff.js");

// Generate mission briefing
module.exports = function makeBriefing() {

	var options = this.items.Options;

	var briefing = [];
	var flight = this.player.flight;

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

	// Flight plan briefing output
	for (var action of flight.plan) {
		
		if (!makeBriefingPlan[action.type]) {
			continue;
		}
		
		// Make plan action briefing
		var actionBriefing = makeBriefingPlan[action.type].call(this, action, flight);
		
		if (actionBriefing && actionBriefing.length) {
			briefing.push(actionBriefing);
		}
	}
	
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
	
	var flight = this.player.flight;
	var output = "";
	
	flight.elements.forEach(function(element, elementIndex) {
		
		// Add flight formation and unit data
		if (elementIndex === 0) {

			var unit = element.unit;

			if (!flight.formation.name) {

				// Generic formation name
				output += "Flight";
			}
			else {
				output += "<i>" + flight.formation.name + "</i>";
			}

			// Unit name
			// TODO: Show all units if elements are from different units
			output += ' of <font color="' + briefingColor.LIGHT + '">' + unit.name + "</font>";

			// Unit alias
			if (unit.alias) {
				output += " <i>“" + unit.alias + "”</i>";
			}

			output += ",<br><br>";
		}

		element.forEach(function(plane) {

			var pilot = plane.pilot;
			var rank = pilot.rank.acronym;
			
			// Use full rank name when acronym is not available
			if (!rank) {
				rank = pilot.rank.name;
			}
			
			output += "\t";

			// Plane call number
			if (flight.planes > 1) {
				output += plane.number + ". ";
			}

			output += '<font size="16"><i>' + rank + "</i></font> ";

			// Highlighted player pilot name
			if (plane === flight.player) {
				output += '<font color="' + briefingColor.LIGHT + '">' + pilot.name + "</font>";
			}
			else {
				output += pilot.name;
			}

			output += ' <font color="' + briefingColor.DARK + '">→</font><font size="16"><i>';
			output += this.planesByID[plane.plane].name;
			output += "</i></font><br>";

		}, this);

		// Element separator
		if ((elementIndex + 1) !== flight.elements.length) {
			output += '<font size="8"></font><br>';
		}
		// Flight callsign
		else if (flight.callsign) {
			output += "<br>\tCallsign <i>“" + flight.callsign.name + "”</i>.";
		}
		
	}, this);
	
	return output;
}