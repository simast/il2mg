/** @copyright Simas Toleikis, 2014 */
"use strict";

// Generate mission briefing
module.exports = function(mission) {

	var options = mission.blocks.Options;

	var briefing = [];

	// Date and time
	briefing.push(makeDateAndTime(mission));

	// TODO: Location info
	// TODO: Task/objective info
	// TODO: Flight and payload info
	// TODO: Battle situation
	// TODO: Weather report

	options.setDescription(mission.getLC(briefing.join("<br><br>")));
};

// Make mission briefing date and time output
function makeDateAndTime(mission) {

	var time = mission.time;
	var output = "";

	output += mission.date.format("MMMM Do, YYYY") + "<br>";
	output += '<font size="13">';
	output += mission.date.format("HH.mm") + " hrs";

	// Display time period names
	if (typeof mission.time === "object") {

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