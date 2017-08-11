/** @copyright Simas Toleikis, 2016 */
"use strict"

const React = require("react")
const createMission = require("./store")
const ChoiceListItem = require("./ChoiceListItem")

// Data choice list component
class ChoiceList extends React.Component {

	// Render component
	render() {

		const {type, title, choices} = this.props
		let validCount = 0
		let selectedCount = 0
		let valid
		let reset

		// Build a list of choice item elements to render
		const items = choices.map(choice => {

			if (choice.valid || choice.selected) {
				validCount++
			}

			if (choice.selected) {
				selectedCount++
			}

			return (
				<ChoiceListItem
					key={choice.id.join("")}
					choice={choice}
					onChoiceClick={choices => {
						this.onChoiceClick(type, choices)
					}}
				/>
			)
		})

		if (validCount > 0) {

			let validNum = validCount

			// Use bold font weight to show selected count number
			if (validNum === selectedCount) {
				validNum = <b>{validNum}</b>
			}

			valid = <span>{validNum}</span>
		}

		if (selectedCount > 0) {
			reset = <a className="reset" onClick={() => this.onChoiceReset(type)}></a>
		}

		return (
			<div className={"choiceList " + type}>
				<h2>{title}{valid}{reset}</h2>
				<ul ref={ref => {this.listElement = ref}}>{items}</ul>
			</div>
		)
	}

	componentDidMount() {

		// Scroll first selected choice list item into view (if needed)
		if (this.listElement) {

			const selectedItem = this.listElement.querySelector(".selected")

			if (selectedItem) {
				selectedItem.scrollIntoViewIfNeeded()
			}
		}
	}

	// Handle choice item click
	onChoiceClick(type, choices) {

		const choiceState = Object.assign({}, createMission.choice)

		// NOTE: Multiple choices can be passed in (from merged data items)
		for (const choice of choices) {

			let foundChoice = -1

			// Try to remove existing choice
			if (choiceState[type]) {

				foundChoice = choiceState[type].indexOf(choice)

				if (foundChoice > -1) {

					choiceState[type].splice(foundChoice, 1)

					// Remove empty choice list
					if (!choiceState[type].length) {
						delete choiceState[type]
					}
				}
			}

			// Add new choice
			if (foundChoice === -1) {

				if (!choiceState[type]) {
					choiceState[type] = []
				}

				choiceState[type].push(choice)
			}
		}

		createMission.setChoice(choiceState)
	}

	// Handle choice reset button click
	onChoiceReset(type) {

		const choiceState = Object.assign({}, createMission.choice)

		delete choiceState[type]
		createMission.setChoice(choiceState)
	}
}

module.exports = ChoiceList