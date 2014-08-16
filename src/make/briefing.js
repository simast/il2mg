/** @copyright Simas Toleikis, 2014 */
"use strict";

// Generate mission briefing
module.exports = function(mission) {

	var options = mission.entities.Options;

	var briefing = [];

	// Date and time
	briefing.push(makeDateAndTime(mission));

	// TODO: Location info
	// TODO: Task/objective info
	// TODO: Flight and payload info
	// TODO: Battle situation
	// TODO: Weather report

	options.setDescription(mission.lang(briefing.join("<br><br>")));
};

// Make mission briefing date and time output
function makeDateAndTime(mission) {

	var output = "";

	output += mission.date.format("MMMM Do, YYYY") + "<br>";
	output += '<font size="13">' + mission.date.format("HHmm") + " hours</font>";

	return output;
}