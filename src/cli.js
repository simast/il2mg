import {EOL} from "os"
import util from "util"
import domain from "domain"
import moment from "moment"
import params from "commander"
import log from "./log"
import Mission from "./mission"
import {WeatherState} from "./make/weather"
import {MapSeason} from "./make/map"
import {FlightState} from "./make/flight"

import data, {
	Coalition,
	APPLICATION_NAME,
	APPLICATION_VERSION,
	APPLICATION_COPYRIGHT
} from "./data"

// --help usage line output
params.usage("[options] [mission file and/or path]")

// --version output
params.version(APPLICATION_NAME + " " + APPLICATION_VERSION + " " + APPLICATION_COPYRIGHT)

// Create mission metadata file (--meta)
params.option("-M, --meta", "create metadata file")

// Create language files (--lang)
params.option(
	"-L, --lang [language]",
	"create language files",
	value => String(value)
		.split(",")
		.map(lang => lang.trim())
		.filter(lang => lang.length > 0)
)

// NOTE: Some options are enabled only in development mode!
if (process.env.NODE_ENV !== "production") {

	// Set mission seed value (--seed)
	params.option("-S, --seed <seed>", "set mission seed value")

	// Turn on debug mode (--debug)
	params.option(
		"-D, --debug [features]",
		(() => {

			let desc = "use debug (development) mode" + EOL + EOL

			desc += '\t"airfields" - Debug airfields.' + EOL
			desc += '\t"fronts" - Debug fronts and territories.' + EOL
			desc += '\t"flights" - Debug flights.' + EOL

			return desc
		})(),
		value => {

			const features = Object.create(null)

			String(value).split(",").forEach(feature => {

				feature = feature.trim()

				if (feature) {
					features[feature] = true
				}
			})

			return features
		}
	)
}

// Select mission file format (--format)
params.option("-f, --format <format>", (() => {

	let desc = "set mission file format" + EOL + EOL

	desc += util.format('\t"%s" - %s' + EOL, Mission.FORMAT_BINARY, "Binary format (default).")
	desc += util.format('\t"%s" - %s' + EOL, Mission.FORMAT_TEXT, "Text format.")

	return desc
})())

// Select desired battle (--battle)
params.option("-b, --battle <battle>", (() => {

	let desc = "select a battle" + EOL + EOL

	for (const battleID in data.battles) {
		desc += util.format('\t"%s" - %s' + EOL, battleID, data.battles[battleID].name)
	}

	return desc
})())

// Select mission date (--date)
params.option(
	"-d, --date <YYYY-MM-DD>",
	(() => {

		let desc = "select mission date" + EOL + EOL

		desc += "\tValid date values will depend on the selected battle:" + EOL + EOL

		for (const battleID in data.battles) {

			const battle = data.battles[battleID]
			const battleFrom = moment(battle.from).format("YYYY-MM-DD")
			const battleTo = moment(battle.to).format("YYYY-MM-DD")

			desc += util.format('\t%s (from "%s" to "%s")' + EOL, battle.name, battleFrom, battleTo)
		}

		desc += EOL + "\tDate can also be specified using special season values:" + EOL
		desc += EOL + "\t"

		Object.keys(MapSeason)
			// A special desert "season" is only used for desert plane skins
			.filter(type => MapSeason[type] !== MapSeason.Desert)
			.forEach((type, index, seasons) => {

				if (index === seasons.length - 1) {
					desc += " or "
				}

				desc += '"' + MapSeason[type] + '"'

				if (index < seasons.length - 2) {
					desc += ", "
				}
			})

		desc += "." + EOL

		return desc
	})(),
	value => {

		// Try YYYY-MM-DD format
		const date = moment(value, "YYYY-MM-DD", true)

		if (date.isValid()) {
			return date
		}

		return value
	}
)

// Select mission time (--time)
params.option(
	"-t, --time <HH:MM>",
	(() => {

		let desc = "select mission time" + EOL + EOL

		desc += "\tTime can also be specified using special values:" + EOL + EOL

		for (const timeID in data.time) {
			desc += util.format('\t"%s" - %s' + EOL, timeID, data.time[timeID].description)
		}

		return desc
	})(),
	value => {

		// Try HH:MM or HH:MM:SS format
		const time = moment(value, ["HH:mm", "HH:mm:ss"], true)

		if (time.isValid()) {
			return time
		}

		return value
	}
)

// Select desired coalition (--coalition)
params.option(
	"-C, --coalition <coalition>",
	(() => {

		let desc = "select a coalition" + EOL + EOL

		desc += '\t"' + Coalition.Allies + '" - Allies' + EOL
		desc += '\t"' + Coalition.Axis + '" - Axis' + EOL

		return desc
	})(),
	parseInt
)

// Select desired country (--country)
params.option(
	"-c, --country <country>",
	(() => {

		let desc = "select a country" + EOL + EOL

		for (const countryID in data.countries) {
			desc += util.format('\t"%s" - %s' + EOL, countryID, data.countries[countryID].name)
		}

		return desc
	})(),
	parseInt
)

// Select desired task (--task)
params.option(
	"-T, --task <task>",
	(() => {

		let desc = "select a task" + EOL + EOL

		for (const taskID in data.tasks) {

			const task = data.tasks[taskID]

			if (task.name) {
				desc += util.format('\t"%s" - %s.' + EOL, taskID, task.name)
			}
		}

		return desc
	})(),
	value => String(value).trim()
)

// Set a custom pilot (--pilot)
params.option(
	"-P, --pilot <rank,name>",
	(() => {

		let desc = "set a custom pilot" + EOL + EOL

		desc += "\tPilot rank can be specified by prefixing the name with a number and" + EOL
		desc += "\ta comma character. The rank number depends on the country, but always" + EOL
		desc += "\tstarts from 1 and is incremented for each rank in a hierarchy." + EOL + EOL
		desc += "\tExamples:" + EOL + EOL
		desc += '\t-p "10" - Set only pilot rank.' + EOL
		desc += '\t-p "Name Surname" - Set only pilot name.' + EOL
		desc += '\t-p "10, Name Surname" - Set pilot rank and name.' + EOL

		return desc
	})(),
	value => String(value).trim()
)

// Set flight state (--state)
params.option(
	"-s, --state <state>",
	(() => {

		let desc = "set flight state" + EOL + EOL

		desc += '\t"' + FlightState.Start + '" - Start from parking area or taxiway (default).' + EOL
		desc += '\t"' + FlightState.Runway + '" - Start from runway.' + EOL

		return desc
	})(),
	value => {

		value = String(value).trim()

		// Try flight state as a number
		const state = Number(value)

		if (isNaN(state) || state < 0 || state >= 1) {
			return value
		}

		return state
	}
)

// Set desired weather conditions (--weather)
params.option(
	"-w, --weather <weather>",
	(() => {

		let desc = "set weather conditions" + EOL + EOL

		desc += '\t"perfect" - Perfect weather conditions.' + EOL
		desc += '\t"good" - Good weather conditions.' + EOL
		desc += '\t"bad" - Bad weather conditions.' + EOL
		desc += '\t"extreme" - Extreme weather conditions.' + EOL

		return desc
	})(),
	value => String(value).trim()
)

// Select desired plane (--plane)
params.option(
	"-p, --plane <plane>",
	"select a plane",
	value => String(value).trim()
)

// Select desired unit (--unit)
params.option(
	"-u, --unit <unit>",
	"select a unit",
	value => String(value).trim()
)

// Select desired airfield (--airfield)
params.option(
	"-a, --airfield <airfield>",
	"select an airfield",
	value => String(value).trim()
)

export default argv => {

	const appDomain = domain.create()

	// Handle app domain error events and uncaught exceptions
	appDomain.on("error", error => {

		// Handle simple string errors
		if (typeof error === "string") {
			log.E(error)
		}
		// Handle array error messages (with extra meta data)
		else if (Array.isArray(error)) {
			log.E.apply(log, error)
		}
		// Log exceptions/errors
		else if (error instanceof Error) {

			let message = error.toString()

			// Use full error message (with stack trace) in debug mode
			if (params.debug && error.stack) {
				message = error.stack
			}

			log.E(message)
		}

		process.exit(1)
	})

	// Run app domain logic
	appDomain.run(async () => {

		try {
			params.parse(argv)
		}
		finally {

			// Turn on verbose log level in debug mode
			if (params.debug) {
				log.transports.console.level = "I"
			}
		}

		try {

			// Validate command line params

			// --lang
			if (Array.isArray(params.lang)) {

				params.lang.forEach(lang => {

					if (data.languages.indexOf(lang) === -1) {
						throw ["Invalid language!", {language: lang}]
					}
				})
			}

			// --debug
			if (typeof params.debug === "boolean" && params.debug) {

				// Simple debug mode (without extra features)
				params.debug = Object.create(null)
			}

			// --format
			if (params.format !== undefined) {

				if ([Mission.FORMAT_TEXT, Mission.FORMAT_BINARY].indexOf(params.format) < 0) {
					throw ["Unknown mission file format!", {format: params.format}]
				}
			}

			// --battle
			if (params.battle && !data.battles[params.battle]) {
				throw ["Unknown battle!", {battle: params.battle}]
			}

			// --date
			if (params.date) {

				if (typeof params.date === "object") {
					params.date = params.date.format("YYYY-MM-DD")
				}
				else {

					// Validate date as a special season value
					let isDateSeason = false

					for (const type in MapSeason) {

						if (params.date === MapSeason[type] && MapSeason[type] !== MapSeason.Desert) {

							isDateSeason = true
							break
						}
					}

					if (!isDateSeason) {
						throw ["Invalid mission date!", {date: params.date}]
					}
				}
			}

			// --time
			if (params.time && typeof params.time === "string" && !data.time[params.time]) {
				throw ["Invalid mission time!", {time: params.time}]
			}

			// --coalition
			if (params.coalition !== undefined &&
				[Coalition.Allies, Coalition.Axis].indexOf(params.coalition) === -1) {

				throw ["Unknown coalition!", {coalition: params.coalition}]
			}

			// --country
			if (params.country !== undefined && !data.countries[params.country]) {
				throw ["Unknown country!", {country: params.country}]
			}

			// --task
			if (params.task !== undefined) {

				// NOTE: The special ~ symbol can be used to specify task story!
				const task = params.task.split(/~+?/)

				params.task = task[0]

				if (task.length > 1) {
					params.story = task.slice(1)
				}
			}

			// --pilot
			if (params.pilot !== undefined && !params.pilot.length) {
				throw ["Invalid pilot name!", {pilot: params.pilot}]
			}

			// --plane
			if (params.plane !== undefined && !params.plane.length) {
				throw ["Invalid plane name!", {plane: params.plane}]
			}

			// --unit
			if (params.unit !== undefined && !params.unit.length) {
				throw ["Invalid unit name!", {unit: params.unit}]
			}

			// --airfield
			if (params.airfield !== undefined && !params.airfield.length) {
				throw ["Invalid airfield name!", {airfield: params.airfield}]
			}

			// --state
			if (params.state !== undefined &&
					[FlightState.Start, FlightState.Runway].indexOf(params.state) === -1 &&
					typeof params.state !== "number") {

				throw ["Invalid flight state!", {state: params.state}]
			}

			// --weather
			if (params.weather !== undefined) {

				const weatherState = Object.keys(WeatherState).find(state => (
					state.toLowerCase() === params.weather.toLowerCase()
				))

				if (!weatherState) {
					throw ["Invalid weather conditions!", {weather: params.weather}]
				}
				else {
					params.weather = WeatherState[weatherState]
				}
			}

			// Create a new mission
			const mission = new Mission(params)

			// Save mission files
			await mission.save(params.args[0])

			log.D(mission.title + " (" + mission.planes[mission.player.plane].name + ")")
			process.exit()
		}
		catch (error) {
			appDomain.emit("error", error)
		}
	})
}
