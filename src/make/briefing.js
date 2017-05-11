/** @copyright Simas Toleikis, 2015 */
"use strict"

const {briefingColor} = require("../data")
const makeBriefingText = require("./briefing.text")
const makeBriefingWeather = require("./briefing.weather")

// Generate mission briefing
module.exports = function makeBriefing() {

	const {rand} = this
	const options = this.items.Options
	const flight = this.player.flight
	const task = flight.task
	let briefing = []

	// Date and time
	briefing.push(makeBriefingDateAndTime.call(this))

	let storyType

	// Task intro story
	if (task.story) {

		const paramsStory = this.params.story
		let story = task.story
		let paramsStoryID
		let paramsStoryType

		// Set params story ID and type
		if (paramsStory) {

			paramsStoryID = parseInt(paramsStory[0], 10)

			if (isNaN(paramsStoryID)) {

				paramsStoryType = paramsStory[0]
				paramsStoryID = parseInt(paramsStory[1], 10)
			}
		}

		if (typeof story === "object" && !Array.isArray(story)) {

			if (paramsStoryType) {
				storyType = paramsStoryType
			}
			else {
				storyType = rand.pick(Object.keys(story))
			}

			story = story[storyType]
		}

		if (!Array.isArray(story)) {
			story = [story]
		}

		let selectedStory

		// Force using specific story from the story param
		if (paramsStoryID) {
			selectedStory = story[paramsStoryID - 1]
		}

		// Pick random task story
		if (selectedStory === undefined) {
			selectedStory = rand.pick(story)
		}

		briefing.push(makeBriefingText.call(this, selectedStory))
	}

	// Mission title
	let title = this.battle.name

	// Use task title
	if (task.title) {

		if (typeof task.title === "object" && storyType) {
			title = task.title[storyType]
		}
		else {
			title = task.title
		}

		if (!Array.isArray(title)) {
			title = [title]
		}

		title = makeBriefingText.call(this, rand.pick(title))
	}

	options.setName(this.getLC(title))
	this.title = title

	// Flight elements and pilot info
	briefing.push(makeBriefingFlight.call(this))

	// TODO: Payload info

	// Weather report
	briefing.push(makeBriefingWeather.call(this))

	briefing = briefing.join("<br><br>")

	const briefingPlan = []

	// Flight plan briefing output
	for (const activity of flight.plan) {

		if (!activity.makeBriefing) {
			continue
		}

		// Make plan activity briefing
		const activityBriefing = activity.makeBriefing()

		if (activityBriefing && activityBriefing.length) {
			briefingPlan.push(activityBriefing)
		}
	}

	// NOTE: Using smaller line breaks for separating plan activities
	if (briefingPlan.length) {

		briefingPlan.unshift('<font color="' + briefingColor.DARK + '">···</font>')
		briefingPlan.unshift("")

		briefing += briefingPlan.join('<br><font size="8"></font><br>')
	}

	const briefingHighlights = new Set()

	// Highlight marked briefing text
	briefing = briefing.replace(/\[(.*?)\]/g, (match, highlight) => {

		// Highlight the same segment/word only once!
		if (briefingHighlights.has(highlight)) {
			return highlight
		}

		briefingHighlights.add(highlight)

		return '<font color="' + briefingColor.LIGHT + '">' + highlight + "</font>"
	})

	options.setDescription(this.getLC(briefing))
	this.briefing = briefing
}

// Make mission briefing date and time output
function makeBriefingDateAndTime() {

	const time = this.time
	let output = ""

	output += this.date.format("MMMM Do, YYYY") + "<br>"
	output += '<font size="14">'
	output += this.date.format("HH.mm") + " hrs"

	// Display time period names
	if (typeof this.time === "object") {

		const timePeriods = Object.keys(time)

		// Remove "day" as daylight will be indicated by other periods
		if (time.day) {
			timePeriods.splice(timePeriods.indexOf("day"), 1)
		}

		// Remove "night" when night-time is indicated as midnight
		if (time.midnight) {

			const nightIndex = timePeriods.indexOf("night")

			if (nightIndex >= 0) {
				timePeriods.splice(nightIndex, 1)
			}
		}

		// Remove "morning" when morning is indicated as sunrise
		if (time.sunrise) {

			const morningIndex = timePeriods.indexOf("morning")

			if (morningIndex >= 0) {
				timePeriods.splice(morningIndex, 1)
			}
		}

		// Remove "evening" when evening is indicated as sunset or dusk
		if (time.sunset || time.dusk) {

			const eveningIndex = timePeriods.indexOf("evening")

			if (eveningIndex >= 0) {
				timePeriods.splice(eveningIndex, 1)
			}
		}

		if (timePeriods.length) {
			output += ", " + timePeriods.join(", ")
		}
	}

	output += "</font>"

	return output
}

// Make mission flight and pilot info output
function makeBriefingFlight() {

	const flight = this.player.flight
	const unit = this.units[flight.unit]
	let output = ""

	// Country specific formation name
	if (flight.formation.name) {
		output += "<i>" + flight.formation.name + "</i>"
	}
	// Generic formation name
	else {
		output += "Flight"
	}

	// Unit name
	output += " of [" + unit.name + "]"

	// Unit suffix
	if (unit.suffix) {
		output += " " + unit.suffix
	}

	// Unit alias
	if (unit.alias) {
		output += " <i>“" + unit.alias + "”</i>"
	}

	output += ",<br><br>"

	flight.elements.forEach((element, elementIndex) => {
		element.forEach(plane => {

			const pilot = plane.pilot
			let rank = pilot.rank.abbr

			// Use full rank name when abbreviation is not available
			if (!rank) {
				rank = pilot.rank.name
			}

			output += "\t"

			// Plane call number
			if (flight.planes > 1) {
				output += '<font size="16" color="' + briefingColor.DARK + '">' + plane.number + ".</font> "
			}

			output += '<font size="16"><i>' + rank + "</i></font> "

			// Highlighted player pilot name
			if (plane === flight.player) {
				output += "[" + pilot.name + "]"
			}
			else {
				output += pilot.name
			}

			output += ' <font color="' + briefingColor.DARK + '">⇢</font> <font size="16"><i>'
			output += this.planes[plane.plane].name
			output += "</i></font><br>"

		})

		// Element separator
		if ((elementIndex + 1) !== flight.elements.length) {

			// Don't use element separator for hidden formations
			if (!flight.formation.hidden) {
				output += '<font size="8"></font><br>'
			}
		}
		// Flight callsign
		else if (flight.callsign) {
			output += "<br>\tCallsign <i>“" + flight.callsign.name + "”</i>."
		}

	})

	return output
}