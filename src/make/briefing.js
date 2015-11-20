/** @copyright Simas Toleikis, 2015 */
"use strict";

var requireDir = require("require-directory");

// Data constants
var briefingColor = DATA.briefingColor;

// Briefing make parts
var makeBriefingParts = requireDir(module, {include: /briefing\..+\.js$/});
var makeBriefingText = makeBriefingParts["briefing.text"];
var makeBriefingWeather = makeBriefingParts["briefing.weather"];

// Generate mission briefing
module.exports = function makeBriefing() {

	var rand = this.rand;
	var options = this.items.Options;
	var briefing = [];
	var flight = this.player.flight;
	var task = this.tasks[flight.task];

	// Mission name
	var name = this.battle.name;
	
	// Use task name
	if (task.name) {
		
		name = task.name;
		
		if (!Array.isArray(name)) {
			name = [name];
		}
		
		name = makeBriefingText.call(this, rand.pick(name));
	}
	
	options.setName(this.getLC(name));
	this.name = name;

	// Date and time
	briefing.push(makeBriefingDateAndTime.call(this));
	
	// Task intro story
	if (task.story) {
		
		var story = task.story;
		
		if (!Array.isArray(story)) {
			story = [story];
		}
		
		if (story.length) {
			briefing.push(makeBriefingText.call(this, rand.pick(story)));
		}
	}

	// Flight elements and pilot info
	briefing.push(makeBriefingFlight.call(this));

	// TODO: Payload info
	
	// Weather report
	briefing.push(makeBriefingWeather.call(this));
	
	var briefingPlan = [];

	// Flight plan briefing output
	for (var action of flight.plan) {
		
		var makeBriefingPlan = makeBriefingParts["briefing." + action.type];
		
		// Use custom plan action briefing text
		if (action.briefing) {
			makeBriefingPlan = action.briefing;
		}

		if (!makeBriefingPlan) {
			continue;
		}
		
		// Make plan action briefing
		var actionBriefing = makeBriefingPlan.call(this, action, flight);
		
		if (actionBriefing && actionBriefing.length) {
			briefingPlan.push(actionBriefing);
		}
	}
	
	// NOTE: Using smaller line breaks for separating plan actions
	if (briefingPlan.length) {
		briefing.push(briefingPlan.join('<br><font size="8"></font><br>'));
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
	var unit = this.units[flight.unit];
	var output = "";
	
	// Country specific formation name
	if (flight.formation.name) {
		output += "<i>" + flight.formation.name + "</i>";
	}
	// Generic formation name
	else {
		output += "Flight";
	}

	// Unit name
	output += ' of <font color="' + briefingColor.LIGHT + '">' + unit.name + "</font>";

	// Unit alias
	if (unit.alias) {
		output += " <i>“" + unit.alias + "”</i>";
	}

	output += ",<br><br>";
	
	flight.elements.forEach(function(element, elementIndex) {
		element.forEach(function(plane) {

			var pilot = plane.pilot;
			var rank = pilot.rank.abbr;
			
			// Use full rank name when abbreviation is not available
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
			output += this.planes[plane.plane].name;
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