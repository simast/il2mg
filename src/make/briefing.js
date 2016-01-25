/** @copyright Simas Toleikis, 2015 */
"use strict";

const requireDir = require("require-directory");
const data = require("../data");

// Data constants
const briefingColor = data.briefingColor;

// Briefing make parts
const makeBriefingParts = requireDir(module, {include: /briefing\..+\.js$/});
const makeBriefingText = makeBriefingParts["briefing.text"];
const makeBriefingWeather = makeBriefingParts["briefing.weather"];

// Generate mission briefing
module.exports = function makeBriefing() {

	const rand = this.rand;
	const options = this.items.Options;
	const flight = this.player.flight;
	const task = flight.task;
	let briefing = [];

	// Mission title
	let title = this.battle.name;
	
	// Use task title
	if (task.title) {
		
		title = task.title;
		
		if (!Array.isArray(title)) {
			title = [title];
		}
		
		title = makeBriefingText.call(this, rand.pick(title));
	}
	
	options.setName(this.getLC(title));
	this.title = title;

	// Date and time
	briefing.push(makeBriefingDateAndTime.call(this));
	
	// Task intro story
	if (task.story) {
		
		let story = task.story;
		
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
	
	briefing = briefing.join("<br><br>");
	
	const briefingPlan = [];

	// Flight plan briefing output
	for (const action of flight.plan) {
		
		let makePlanBriefing;
		
		// Use default/common plan action briefing
		if (action.type) {
			makePlanBriefing = makeBriefingParts["briefing." + action.type];
		}
		
		// Use custom plan action briefing
		if (typeof action.makeBriefing === "function") {
			makePlanBriefing = action.makeBriefing;
		}

		if (!makePlanBriefing) {
			continue;
		}
		
		// Make plan action briefing
		const actionBriefing = makePlanBriefing.call(this, action, flight);
		
		if (actionBriefing && actionBriefing.length) {
			briefingPlan.push(actionBriefing);
		}
	}
	
	// NOTE: Using smaller line breaks for separating plan actions
	if (briefingPlan.length) {
		
		briefingPlan.unshift('<font color="' + briefingColor.DARK + '">···</font>');
		briefingPlan.unshift("");
		
		briefing += briefingPlan.join('<br><font size="8"></font><br>');
	}
	
	options.setDescription(this.getLC(briefing));
};

// Make mission briefing date and time output
function makeBriefingDateAndTime() {

	const time = this.time;
	let output = "";

	output += this.date.format("MMMM Do, YYYY") + "<br>";
	output += '<font size="14">';
	output += this.date.format("HH.mm") + " hrs";

	// Display time period names
	if (typeof this.time === "object") {

		const timePeriods = Object.keys(time);

		// Remove "day" as daylight will be indicated by other periods
		if (time.day) {
			timePeriods.splice(timePeriods.indexOf("day"), 1);
		}

		// Remove "night" when night-time is indicated as midnight
		if (time.midnight) {

			const nightIndex = timePeriods.indexOf("night");

			if (nightIndex >= 0) {
				timePeriods.splice(nightIndex, 1);
			}
		}

		// Remove "morning" when morning is indicated as sunrise
		if (time.sunrise) {

			const morningIndex = timePeriods.indexOf("morning");

			if (morningIndex >= 0) {
				timePeriods.splice(morningIndex, 1);
			}
		}

		// Remove "evening" when evening is indicated as sunset or dusk
		if (time.sunset || time.dusk) {

			const eveningIndex = timePeriods.indexOf("evening");

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
	
	const flight = this.player.flight;
	const unit = this.units[flight.unit];
	let output = "";
	
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
	
	flight.elements.forEach((element, elementIndex) => {
		element.forEach((plane) => {

			const pilot = plane.pilot;
			let rank = pilot.rank.abbr;
			
			// Use full rank name when abbreviation is not available
			if (!rank) {
				rank = pilot.rank.name;
			}
			
			output += "\t";

			// Plane call number
			if (flight.planes > 1) {
				output += '<font size="16" color="' + briefingColor.DARK + '">' + plane.number + ".</font> ";
			}

			output += '<font size="16"><i>' + rank + "</i></font> ";

			// Highlighted player pilot name
			if (plane === flight.player) {
				output += '<font color="' + briefingColor.LIGHT + '">' + pilot.name + "</font>";
			}
			else {
				output += pilot.name;
			}

			output += ' <font color="' + briefingColor.DARK + '">⇢</font> <font size="16"><i>';
			output += this.planes[plane.plane].name;
			output += "</i></font><br>";

		});

		// Element separator
		if ((elementIndex + 1) !== flight.elements.length) {
			
			// Don't use element separator for hidden formations
			if (!flight.formation.hidden) {
				output += '<font size="8"></font><br>';
			}
		}
		// Flight callsign
		else if (flight.callsign) {
			output += "<br>\tCallsign <i>“" + flight.callsign.name + "”</i>.";
		}
		
	});
	
	return output;
}