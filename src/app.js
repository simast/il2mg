/** @copyright Simas Toleikis, 2015 */
"use strict";

var os = require("os");
var util = require("util");
var domain = require("domain");
var moment = require("moment");
var winston = require("winston");
var Mission = require("./mission");
var data = require("./data");

var logColors = {
	I: "gray", // Info
	W: "yellow", // Warning
	E: "red", // Error
	D: "green" // Done
};

var logLevels = {};
Object.keys(logColors).forEach(function(value, index) {
	logLevels[value] = index;
});

// Setup winston logger
var log = global.log = new (winston.Logger)({
	levels: logLevels,
	colors: logColors,
	transports: [
		new winston.transports.Console({
			level: "E", // Default log reporting level
			colorize: true
		})
	]
});

// NOTE: Workaround for log.profile()
log.info = log.I;

// NOTE: Intercept all console.error traffic (commander error messages) and log
// them as winston "error" level log messages.
console.error = function() {

	if (!arguments.length) {
		return;
	}

	var message = String(arguments[0]).trim();

	if (message.length) {

		message = message.replace(/^error:\s*/i, "");

		arguments[0] = message;
		log.E.apply(log, arguments);
	}
};

// Setup command line interface
var params = require("commander");

params.version(data.version);
params.usage("[options] [mission file and/or path]");

// Select mission file format (--format)
params.option("-f, --format <format>", (function() {

	var desc = "set mission file format" + os.EOL;
	
	desc += util.format('\t"%s" - %s\n', Mission.FORMAT_TEXT, "Text format.");
	desc += util.format('\t"%s" - %s\n', Mission.FORMAT_BINARY, "Binary format (default).");

	return desc;
})());

// Select desired battle (--battle)
params.option("-b, --battle <battle>", (function() {

	var desc = "select a battle" + os.EOL;

	for (var battleID in data.battles) {
		desc += util.format('\t"%s" - %s\n', battleID, data.battles[battleID].name);
	}

	return desc;
})());

// Select mission date (--date)
params.option("-d, --date <YYYY-MM-DD>", (function() {

	var desc = "select mission date" + os.EOL;

	desc += "\tValid date values will depend on the selected battle:" + os.EOL;

	for (var battleID in data.battles) {

		var battle = data.battles[battleID];
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

	desc += "\tTime can also be specified using special values:" + os.EOL;

	for (var timeID in data.time) {
		desc += util.format('\t"%s" - %s\n', timeID, data.time[timeID].description);
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

	for (var coalitionID in data.coalitions) {
		desc += util.format('\t"%s" - %s\n', coalitionID, data.coalitions[coalitionID]);
	}

	return desc;
})(), parseInt);

// Select desired country (--country)
params.option("-c, --country <country>", (function() {

	var desc = "select a country" + os.EOL;

	for (var countryID in data.countries) {
		desc += util.format('\t"%s" - %s\n', countryID, data.countries[countryID].name);
	}

	return desc;
})(), parseInt);

// Select desired airfield (--airfield)
params.option("-a, --airfield <airfield>", "select an airfield", function(value) {
	return String(value).trim();
});

// Turn on debug mode (--debug)
params.option("-D, --debug", "use debug (development) mode");

/**
 * TODO: Support other command line params:
 *
 * --name - Mission name.
 * --type - Mission type.
 * --airport - Airport.
 * --unit - Squadron/group/unit/etc.
 * --plane - Plane type.
 * --pilot - Pilot name.
 * --players - Number of players.
 * --complexity - Mission complexity (detail level).
 * --difficulty - Mission difficulty level.
 */
params.parse(process.argv);

// Turn on verbose log level in debug mode
if (params.debug) {
	log.transports.console.level = "I";
}

var appDomain = domain.create();

// Handle app domain error events and uncaught exceptions
appDomain.on("error", function(error) {

	// Handle simple string errors
	if (typeof error === "string") {
		log.E(error);
	}
	// Handle array error messages (with extra meta data)
	else if (Array.isArray(error)) {
		log.E.apply(log, error);
	}
	// Log exceptions/errors
	else if (error instanceof Error) {

		log.E(error.message ? error.message : error);

		// Include stack trace in debug mode
		if (params.debug && error.stack) {
			console.log(error.stack);
		}
	}

	process.exit(1);
});

// Run app domain logic
appDomain.run(function() {

	// Validate command line params

	// --format
	if (params.format !== undefined) {
		
		if ([Mission.FORMAT_TEXT, Mission.FORMAT_BINARY].indexOf(params.format) < 0) {
			throw ["Unknown mission file format!", {format: params.format}];
		}
	}
	
	// --battle
	if (params.battle && !data.battles[params.battle]) {
		throw ["Unknown battle!", {battle: params.battle}];
	}

	// --date
	if (params.date && typeof params.date !== "object") {
		throw ["Invalid mission date!", {date: params.date}];
	}

	// --time
	if (params.time && typeof params.time === "string" && !data.time[params.time]) {
		throw ["Invalid mission time!", {time: params.time}];
	}

	// --coalition
	if (params.coalition !== undefined && !data.coalitions[params.coalition]) {
		throw ["Unknown coalition!", {coalition: params.coalition}];
	}

	// --country
	if (params.country !== undefined && !data.countries[params.country]) {
		throw ["Unknown country!", {country: params.country}];
	}

	// --airfield
	if (params.airfield !== undefined && !params.airfield.length) {
		throw ["Invalid airfield name!", {airfield: params.airfield}];
	}

	// Create a new mission
	var mission = new Mission(params);

	// Save mission files
	mission.save(params.args[0]).then(function() {
		log.D("Success!");
	}, function(error) {
		appDomain.emit("error", error);
	});
});