/** @copyright Simas Toleikis, 2015 */
"use strict";

const os = require("os");
const util = require("util");
const domain = require("domain");
const moment = require("moment");
const winston = require("winston");

// Load static global data
require("./data");

const Mission = require("./mission");
const flightState = DATA.flightState;
const weatherState = DATA.weatherState;
const EOL = os.EOL;

const logColors = {
	D: "green", // Done
	E: "red", // Error
	W: "yellow", // Warning
	I: "gray" // Info
};

const logLevels = {};
Object.keys(logColors).forEach((value, index) => {
	logLevels[value] = index;
});

// Setup winston logger
const log = global.log = new (winston.Logger)({
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

	let message = String(arguments[0]).trim();

	if (message.length) {

		message = message.replace(/^error:\s*/i, "");

		arguments[0] = message;
		log.E.apply(log, arguments);
	}
};

// Setup command line interface
const params = require("commander");

// --help usage line output
params.usage("[options] [mission file and/or path]");

// --version output
params.version(DATA.name + " " + DATA.version + " " + DATA.copyright);

// Set mission seed value (--seed)
params.option("-S, --seed <seed>", "set mission seed value");

// Turn on debug mode (--debug)
if (!DATA.isBinary) {

	params.option("-D, --debug [features]", (() => {

		let desc = "use debug (development) mode" + EOL + EOL;

		desc += '\t"airfields" - Debug airfields.' + EOL;
		desc += '\t"fronts" - Debug fronts and territories.' + EOL;

		return desc;
	})(), (value) => {

		const features = Object.create(null);

		String(value).split(",").forEach((feature) => {

			feature = feature.trim();

			if (feature) {
				features[feature] = true;
			}
		});

		return features;
	});
}

// Select mission file format (--format)
params.option("-f, --format <format>", (() => {

	let desc = "set mission file format" + EOL + EOL;

	desc += util.format('\t"%s" - %s' + EOL, Mission.FORMAT_TEXT, "Text format.");
	desc += util.format('\t"%s" - %s' + EOL, Mission.FORMAT_BINARY, "Binary format (default).");

	return desc;
})());

// Select desired battle (--battle)
params.option("-b, --battle <battle>", (() => {

	let desc = "select a battle" + EOL + EOL;

	for (const battleID in DATA.battles) {
		desc += util.format('\t"%s" - %s' + EOL, battleID, DATA.battles[battleID].name);
	}

	return desc;
})());

// Select mission date (--date)
params.option("-d, --date <YYYY-MM-DD>", (() => {

	let desc = "select mission date" + EOL + EOL;

	desc += "\tValid date values will depend on the selected battle:" + EOL + EOL;

	for (const battleID in DATA.battles) {

		const battle = DATA.battles[battleID];
		const battleFrom = moment(battle.from).format("YYYY-MM-DD");
		const battleTo = moment(battle.to).format("YYYY-MM-DD");

		desc += util.format('\t%s (from "%s" to "%s")' + EOL, battle.name, battleFrom, battleTo);
	}

	return desc;
})(), (value) => {

	// Try YYYY-MM-DD format
	const date = moment(value, "YYYY-MM-DD", true);

	if (date.isValid()) {
		return date;
	}

	return value;
});

// Select mission time (--time)
params.option("-t, --time <HH:MM>", (() => {

	let desc = "select mission time" + EOL + EOL;

	desc += "\tTime can also be specified using special values:" + EOL + EOL;

	for (const timeID in DATA.time) {
		desc += util.format('\t"%s" - %s' + EOL, timeID, DATA.time[timeID].description);
	}

	return desc;
})(), (value) => {

	// Try HH:MM or HH:MM:SS format
	const time = moment(value, ["HH:mm", "HH:mm:ss"], true);

	if (time.isValid()) {
		return time;
	}

	return value;
});

// Select desired coalition (--coalition)
params.option("-C, --coalition <coalition>", (() => {

	let desc = "select a coalition" + EOL + EOL;

	desc += '\t"' + DATA.coalition.ALLIES + '" - Allies' + EOL;
	desc += '\t"' + DATA.coalition.AXIS + '" - Axis' + EOL;

	return desc;
})(), parseInt);

// Select desired country (--country)
params.option("-c, --country <country>", (() => {

	let desc = "select a country" + EOL + EOL;

	for (const countryID in DATA.countries) {
		desc += util.format('\t"%s" - %s' + EOL, countryID, DATA.countries[countryID].name);
	}

	return desc;
})(), parseInt);

// Set a custom pilot (--pilot)
params.option("-p, --pilot <rank,name>", (() => {

	let desc = "set a custom pilot" + EOL + EOL;

	desc += "\tPilot rank can be specified by prefixing the name with a number and" + EOL;
	desc += "\ta comma character. The rank number depends on the country, but always" + EOL;
	desc += "\tstarts from 1 and is incremented for each rank in a hierarchy." + EOL + EOL;
	desc += "\tExamples:" + EOL + EOL;
	desc += '\t-p "10" - Set only pilot rank.' + EOL;
	desc += '\t-p "Name Surname" - Set only pilot name.' + EOL;
	desc += '\t-p "10, Name Surname" - Set pilot rank and name.' + EOL;

	return desc;
})(), (value) => {
	return String(value).trim();
});

// Set flight state (--state)
params.option("-s, --state <state>", (() => {

	let desc = "set flight state" + EOL + EOL;

	desc += '\t"' + flightState.START + '" - Start from parking area or taxiway (default).' + EOL;
	desc += '\t"' + flightState.RUNWAY + '" - Start from runway.' + EOL;

	return desc;
})(), (value) => {

	value = String(value).trim();

	// Try flight state as a number
	const state = Number(value);

	if (isNaN(state) || state < 0 || state > 1) {
		return value;
	}

	return state;
});

// Set desired weather conditions (--weather)
params.option("-w, --weather <weather>", (() => {

	let desc = "set weather conditions" + EOL + EOL;

	desc += '\t"perfect" - Perfect weather conditions.' + EOL;
	desc += '\t"good" - Good weather conditions.' + EOL;
	desc += '\t"bad" - Bad weather conditions.' + EOL;
	desc += '\t"extreme" - Extreme weather conditions.' + EOL;

	return desc;
})(), (value) => {
	return String(value).trim();
});

// Select desired airfield (--airfield)
params.option("-a, --airfield <airfield>", "select an airfield", (value) => {
	return String(value).trim();
});

/**
 * TODO: Support other command-line params:
 *
 * --task - Select task.
 * --unit - Select unit.
 * --plane - Select plane.
 * --players - Number of players.
 * --complexity - Mission complexity (detail level).
 * --difficulty - Mission difficulty level.
 */
params.parse(process.argv);

// Turn on verbose log level in debug mode
if (params.debug) {
	log.transports.console.level = "I";
}

const appDomain = domain.create();

// Handle app domain error events and uncaught exceptions
appDomain.on("error", (error) => {

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
appDomain.run(() => {

	// Validate command line params

	// --debug
	if (typeof params.debug === "boolean" && params.debug) {

		// Simple debug mode (without extra features)
		params.debug = Object.create(null);
	}

	// --format
	if (params.format !== undefined) {

		if ([Mission.FORMAT_TEXT, Mission.FORMAT_BINARY].indexOf(params.format) < 0) {
			throw ["Unknown mission file format!", {format: params.format}];
		}
	}

	// --battle
	if (params.battle && !DATA.battles[params.battle]) {
		throw ["Unknown battle!", {battle: params.battle}];
	}

	// --date
	if (params.date) {

		if (typeof params.date !== "object") {
			throw ["Invalid mission date!", {date: params.date}];
		}
		else {
			params.date = params.date.format("YYYY-MM-DD");
		}
	}

	// --time
	if (params.time && typeof params.time === "string" && !DATA.time[params.time]) {
		throw ["Invalid mission time!", {time: params.time}];
	}

	// --coalition
	if (params.coalition !== undefined &&
		[DATA.coalition.ALLIES, DATA.coalition.AXIS].indexOf(params.coalition) === -1) {
		
		throw ["Unknown coalition!", {coalition: params.coalition}];
	}

	// --country
	if (params.country !== undefined && !DATA.countries[params.country]) {
		throw ["Unknown country!", {country: params.country}];
	}

	// --airfield
	if (params.airfield !== undefined && !params.airfield.length) {
		throw ["Invalid airfield name!", {airfield: params.airfield}];
	}

	// --pilot
	if (params.pilot !== undefined && !params.pilot.length) {
		throw ["Invalid pilot name!", {pilot: params.pilot}];
	}

	// --state
	if (params.state !== undefined &&
			[flightState.START, flightState.RUNWAY].indexOf(params.state) === -1 &&
			typeof params.state !== "number") {

		throw ["Invalid flight state!", {state: params.state}];
	}

	// --weather
	if (params.weather !== undefined) {

		const weather = weatherState[params.weather.toUpperCase()];

		if (typeof weather !== "number") {
			throw ["Invalid weather conditions!", {weather: params.weather}];
		}
		else {
			params.weather = weather;
		}
	}

	// Create a new mission
	const mission = new Mission(params);

	// Save mission files
	mission.save(params.args[0]).then(
		() => {
			log.D(mission.name);
		},
		(error) => {
			appDomain.emit("error", error);
		}
	);
});