/** @copyright Simas Toleikis, 2016 */
"use strict";

const winston = require("winston");

// Colors used for each log level
const logColors = {
	D: "green", // Done
	E: "red", // Error
	W: "yellow", // Warning
	I: "gray" // Info
};

// Set active log levels
const logLevels = {};
Object.keys(logColors).forEach((value, index) => {
	logLevels[value] = index;
});

// Setup winston logger
const log = module.exports = new (winston.Logger)({
	levels: logLevels,
	colors: logColors,
	transports: [
		new winston.transports.Console({
			level: "E", // Default log reporting level (Error + Done)
			colorize: true
		})
	]
});

// HACK: Workaround for log.profile() using hardcoded "info" level
log.info = log.I;

// Intercept all console.error calls (from commander error messages) and log
// them as winston "error" level messages.
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