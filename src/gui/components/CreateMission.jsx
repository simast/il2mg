/** @copyright Simas Toleikis, 2016 */
"use strict"

const path = global.require("path")
const {execFileSync} = global.require("child_process")
const binarySearch = require("binary-search")
const React = require("react")
const {computed} = require("mobx")
const {observer} = require("mobx-react")
const createMission = require("../stores/createMission")
const missions = require("../stores/missions")
const Application = require("./Application")
const Screen = require("./Screen")
const SelectStart = require("./SelectStart")
const SelectBattle = require("./SelectBattle")
const ChoiceList = require("./ChoiceList")

const {Start} = createMission

// Record key data parameter separator
const RECORD_SEP = "~"

// Multiple param values separator (as OR choice)
const PARAM_SEP = ","

// List of record key data parameters
const recordParams = [
	["country", "countries"],
	["unit", "units"],
	["plane", "planes"],
	["airfield", "airfields"],
	["task", "tasks"]
]

// Available battle data choice lists
const choiceLists = [
	["unit", "Units"],
	["plane", "Aircraft"],
	["task", "Tasks"],
	["airfield", "Airfields"]
]

// Create mission screen component
@observer class CreateMission extends React.Component {

	@computed get choices() {
		return this.getChoices(createMission.start)
	}

	// Render component
	render() {

		const {choices} = this
		const {history, location} = this.props
		const screenActions = {
			right: new Map()
		}

		const createProps = {}
		const isFirstCreate = new URLSearchParams(location.search).has("first")

		if (choices.valid) {
			createProps.onClick = this.onCreateClick.bind(this)
		}
		// Show create action button in a disabled state
		else {
			createProps.disabled = true
		}

		// Create mission action
		screenActions.right.set("Create", createProps)

		// Cancel create mission action
		if (!isFirstCreate) {

			screenActions.right.set("Cancel", {
				onClick: () => {
					history.goBack()
				}
			})
		}

		return (
			<Screen id="create" actions={screenActions}>
				<SelectBattle />
				<SelectStart onStartChange={this.onStartChange.bind(this)} />
				<div id="choices">
					{choiceLists.map(([type, title]) => (
						<ChoiceList
							key={type}
							type={type}
							title={title}
							choices={choices[type]}
						/>
					))}
				</div>
			</Screen>
		)
	}

	// Get mission choice data
	getChoices(start) {

		const {battle, battles, date, choice} = createMission
		const choices = Object.create(null)
		const battleData = battles[battle]
		let scanRegExp = (Object.keys(choice).length > 0)

		// Build regular expression object used to scan battle index records
		if (scanRegExp) {

			scanRegExp = []

			for (const [param] of recordParams) {

				const choiceData = choice[param]
				let paramRegExp = ".+?"

				// Match only specified choice values
				if (Array.isArray(choiceData) && choiceData.length) {
					paramRegExp = "(?:" + choiceData.join("|") + ")"
				}

				scanRegExp.push(paramRegExp)
			}

			scanRegExp = new RegExp("^" + scanRegExp.join(RECORD_SEP) + "$")
		}

		// Scan for valid battle data index records
		for (const record in battleData.records) {

			const recordID = battleData.records[record]

			// Allow air starts based on selected start position type
			if (recordID < 0 && start !== Start.Air) {
				continue
			}

			let isValid = true

			// Validate date
			if (date) {

				const dateIndex = battleData.dates[date]

				// NOTE: Using binary search to find record ID in date index
				isValid = (binarySearch(dateIndex, recordID, (a, b) => (a - b)) > -1)
			}

			// Validate choices
			if (isValid && scanRegExp) {
				isValid = scanRegExp.test(record)
			}

			const recordData = record.split(RECORD_SEP)

			// Build player choices
			recordParams.forEach(([param, paramData], paramIndex) => {

				if (!choices[param]) {
					choices[param] = Object.create(null)
				}

				const paramID = recordData[paramIndex]
				let item = choices[param][paramID]

				if (!item) {

					item = choices[param][paramID] = Object.create(null)

					item.id = [paramID]
					item.valid = isValid

					const choiceData = battleData[paramData][paramID]

					// Choice data as a single string (name only)
					if (typeof choiceData === "string") {
						item.data = {name: choiceData}
					}
					// Choice data as an object
					else {
						item.data = choiceData
					}

					// Mark data choice item as selected
					if (choice[param] && choice[param].indexOf(paramID) > -1) {
						item.selected = true
					}
				}

				// Mark data choice item as valid
				if (isValid) {
					item.valid = true
				}
			})
		}

		const data = Object.create(null)

		// Flag used to mark choice data selection as valid/invalid
		data.valid = true

		// Convert choice hash maps into arrays
		for (const choiceType in choices) {

			const nameIndex = Object.create(null)
			const items = data[choiceType] = []
			let isValid = false

			for (const choiceID in choices[choiceType]) {

				const choice = choices[choiceType][choiceID]

				if (!isValid && choice.valid) {
					isValid = true
				}

				// Build choice full name
				const {name, suffix, alias} = choice.data
				let indexName = [name]

				if (suffix) {
					indexName.push(suffix)
				}

				if (alias) {
					indexName.push(alias)
				}

				indexName = indexName.join(" ")

				// Merge choice items with the same name into one selection
				if (nameIndex[indexName]) {

					const idList = nameIndex[indexName].id
					idList.push.apply(idList, choice.id)
				}
				else {

					nameIndex[indexName] = choice
					items.push(choice)
				}
			}

			// Sort items by data name
			if (choiceType !== "unit") {

				items.sort((a, b) => (
					a.data.name.localeCompare(b.data.name, "en", {numeric: true})
				))
			}

			// Invalid data choice selection
			if (!isValid) {
				data.valid = false
			}
		}

		return data
	}

	// Handle start type change
	onStartChange(newStart) {

		const {start: prevStart, choice} = createMission

		if (newStart === prevStart) {
			return
		}

		// Validate current choice list for new start position type
		if (Object.keys(choice).length) {

			const choices = this.getChoices(newStart)
			const choiceState = Object.assign({}, choice)

			for (const type in choiceState) {

				choiceState[type] = choiceState[type].filter(choiceID => {

					const foundChoice = choices[type].find(item => (
						item.id.indexOf(choiceID) !== -1
					))

					return foundChoice !== undefined
				})

				if (!choiceState[type].length) {
					delete choiceState[type]
				}
			}

			createMission.setChoice(choiceState)
		}

		createMission.setStart(newStart)
	}

	// Handle create mission button click
	onCreateClick() {

		const {history} = this.props
		const {battle, start, date, choice} = createMission

		let cliFile = path.join(process.resourcesPath, "il2mg-cli")
		const cliParams = []

		// Use node process and debug mode while in development environment
		if (process.env.NODE_ENV !== "production") {

			cliFile = "node"
			cliParams.push(".", "--debug")
		}

		cliParams.push(
			"--quiet", // Use quiet mode (with error output only and no colors)
			"--meta", // Generate metadata .il2mg file
			"--lang", // Create all language files
			"--format", "binary", // TODO: Set mission file format from options
			"--batle", battle
		)

		// Set start position type (--state parameter)
		let stateValue = "start" // Parking

		if (start === Start.Runway) {
			stateValue = "runway"
		}
		else if (start === Start.Air) {
			stateValue = 0
		}

		cliParams.push("--state", stateValue)

		// Set selected date
		if (date) {
			cliParams.push("--date", date)
		}

		// Set data choices
		for (const param in choice) {
			cliParams.push("--" + param, choice[param].join(PARAM_SEP))
		}

		// Mission files path
		cliParams.push(missions.path)

		// Create mission using CLI application
		try {

			execFileSync(cliFile, cliParams, {
				stdio: ["ignore", "ignore", "pipe"]
			})

			history.replace("/missions")
		}
		catch (e) {
			Application.showErrorMessage(e.stderr.toString())
		}
	}
}

module.exports = CreateMission