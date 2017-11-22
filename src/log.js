import winston from "winston"

// Colors used for each log level
const logColors = {
	D: "green", // Done
	E: "red", // Error
	W: "yellow", // Warning
	I: "gray" // Info
}

// Set active log levels
const logLevels = {}
Object.keys(logColors).forEach((value, index) => {
	logLevels[value] = index
})

// Setup winston logger
const log = new (winston.Logger)({
	levels: logLevels,
	colors: logColors,
	transports: [
		new winston.transports.Console({
			level: "E", // Default log reporting level (Error + Done)
			stderrLevels: ["E"],
			colorize: true
		})
	]
})

// HACK: Workaround for log.profile() using hardcoded "info" level
log.info = log.I

// HACK: Intercept all console.error calls (from commander error messages) and
// log them as winston "error" level messages.
console.error = function() {

	if (!arguments.length) {
		return
	}

	let message = String(arguments[0]).trim()

	if (message.length) {

		message = message.replace(/^error:\s*/i, "").trim()

		arguments[0] = message
		throw Array.prototype.slice.call(arguments)
	}
}

export default log