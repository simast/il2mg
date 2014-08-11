/** @copyright Simas Toleikis, 2014 */
"use strict";

var os = require("os");
var util = require("util");
var moment = require("moment");
var Mission = require("./mission");

// Load required data
var DATA = {
	battles: require("../data/battles"),
	coalitions: require("../data/coalitions"),
	countries: require("../data/countries"),
	time: require("../data/time"),
	version: require("../data/version")
};

// Setup command line interface
var params = require("commander");

params.version(DATA.version);
params.usage("[options] [mission file and/or path]");

// Select desired battle (--battle)
params.option("-b, --battle <battle>", (function() {

	var desc = "select a battle" + os.EOL;

	for (var battleID in DATA.battles) {
		desc += util.format('\t%s ("%s")\n', DATA.battles[battleID].name, battleID);
	}

	return desc;
})());

// Select mission date (--date)
params.option("-d, --date <YYYY-MM-DD>", (function() {

	var desc = "select mission date" + os.EOL;

	desc += "\tValid date values will depend on the selected battle:" + os.EOL;

	for (var battleID in DATA.battles) {

		var battle = DATA.battles[battleID];
		var battleFrom = moment(battle.from).format("YYYY-MM-DD");
		var battleTo = moment(battle.to).format("YYYY-MM-DD");

		desc += util.format('\t%s (from "%s" to "%s")\n', battle.name, battleFrom, battleTo);
	}

	return desc;
})(), function(value) {

	// Try YYYY-MM-DD format
	var date = moment(value, "YYYY-MM-DD", true);

	if (date.isValid()) {
		return date;
	}

	return value;
});

// Select mission time (--time)
params.option("-t, --time <HH:MM>", (function() {

	var desc = "select mission time" + os.EOL;

	desc += "\tTime can also be specified using the following special values:" + os.EOL;

	for (var timeID in DATA.time) {
		desc += util.format('\t%s ("%s")\n', DATA.time[timeID], timeID);
	}

	return desc;
})(), function(value) {

	// Try HH:MM or HH:MM:SS format
	var time = moment(value, ["HH:mm", "HH:mm:ss"], true);

	if (time.isValid()) {
		return time;
	}

	return value;
});

// Select desired coalition (--coalition)
params.option("-C, --coalition <coalition>", (function() {

	var desc = "select a coalition" + os.EOL;

	for (var coalitionID in DATA.coalitions) {

		if (Number(coalitionID)) {
			desc += util.format('\t%s ("%s")\n', DATA.coalitions[coalitionID], coalitionID);
		}
	}

	return desc;
})(), parseInt);

// Select desired country (--country)
params.option("-c, --country <country>", (function() {

	var desc = "select a country" + os.EOL;

	for (var countryID in DATA.countries) {

		if (Number(countryID)) {
			desc += util.format('\t%s ("%s")\n', DATA.countries[countryID].name, countryID);
		}
	}

	return desc;
})(), parseInt);

// Turn on debug mode (--debug)
params.option("-D, --debug", "use debug (development) mode");

/**
 * TODO: Support other command line params:
 *
 * --name - Mission name.
 * --type - Mission type.
 * --unit - Squadron/group/unit/etc.
 * --airplane - Airplane type.
 * --pilot - Pilot name.
 * --players - Number of players.
 * --complexity - Mission complexity (detail level).
 * --difficulty - Mission difficulty level.
 */

params.parse(process.argv);

try {

	// Validate command line params

	// --battle
	if (params.battle && !DATA.battles[params.battle]) {
		throw util.format('Unknown battle: "%s".', params.battle);
	}

	// --date
	if (params.date && typeof params.date !== "object") {
		throw util.format('Invalid mission date value: "%s".', params.date);
	}

	// --time
	if (params.time && typeof params.time === "string" && !DATA.time[params.time]) {
		throw util.format('Invalid mission time value: "%s".', params.time);
	}

	// --coalition
	if (typeof params.coalition !== "undefined" &&
			(!Number(params.coalition) || !DATA.coalitions[params.coalition])) {

		throw util.format('Unknown coalition: "%s".', params.coalition);
	}

	// --country
	if (typeof params.country !== "undefined" &&
			(!Number(params.country) || !DATA.countries[params.country])) {

		throw util.format('Unknown country: "%s".', params.country);
	}

	// Create a new mission
	var mission = new Mission(params);

	var fileName = "test";

	// Save mission files
	mission.saveText(fileName);
	mission.saveBinary(fileName);
	mission.saveLang(fileName);
}
catch (error) {

	// Only handle simple string errors (not exceptions)
	if (util.isError(error)) {
		throw error;
	}

	console.error("ERROR: %s", error);
	process.exit(1);
}