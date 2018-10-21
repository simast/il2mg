import winston from 'winston'

// Colors used for each log level
const colors = {
	D: 'green', // Done
	E: 'red', // Error
	W: 'yellow', // Warning
	I: 'gray' // Info
}

type Log = winston.LoggerInstance & {
	[level in keyof typeof colors]: winston.LeveledLogMethod
}

// Set active log levels
const levels = Object.keys(colors).reduce((result, level, index) => ({
	...result,
	[level]: index
}), {})

// Setup winston logger
export const log = new (winston.Logger)({
	levels,
	colors,
	transports: [
		new winston.transports.Console({
			level: 'E', // Default log reporting level (Error + Done)
			stderrLevels: ['E'],
			colorize: true
		})
	]
}) as Log

// HACK: Workaround for log.profile() using hardcoded "info" level
log.info = log.I
