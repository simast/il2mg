/** @copyright Simas Toleikis, 2014 */
"use strict";

// Generate mission briefing
module.exports = function(mission) {

	var options = mission.blocks.Options;

	var briefing = [];

	briefing.push(mission.date.format("MMMM D, YYYY HH:mm"));

	// Location info
	briefing.push("<b>LOCATION</b>");
	briefing.push("Aliquam rhoncus, dui eu imperdiet commodo, leo orci interdum est, eget varius velit dolor id nulla. Duis ullamcorper, tellus at auctor mattis, turpis ante ultricies risus, id accumsan velit augue in enim.");

	// Task/objective info
	briefing.push("<b>TASK</b>");
	briefing.push("Aliquam rhoncus, dui eu imperdiet commodo, leo orci interdum est, eget varius velit dolor id nulla. Duis ullamcorper, tellus at auctor mattis, turpis ante ultricies risus, id accumsan velit augue in enim.");

	// Flight and payload info
	briefing.push("<b>FLIGHT</b>");
	briefing.push("Aliquam rhoncus, dui eu imperdiet commodo, leo orci interdum est, eget varius velit dolor id nulla. Duis ullamcorper, tellus at auctor mattis, turpis ante ultricies risus, id accumsan velit augue in enim.");

	// Weather and and atmospheric conditions report
	briefing.push("<b>WEATHER REPORT</b>");
	briefing.push("Aliquam rhoncus, dui eu imperdiet commodo, leo orci interdum est, eget varius velit dolor id nulla. Duis ullamcorper, tellus at auctor mattis, turpis ante ultricies risus, id accumsan velit augue in enim.");

	briefing = briefing.join("<br><br>");

	options.setDescription(mission.lang(briefing));
};