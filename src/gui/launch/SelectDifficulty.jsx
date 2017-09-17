/** @copyright Simas Toleikis, 2017 */

import React from "react"
import {observer} from "mobx-react"
import classNames from "classnames"
import {Difficulty} from "."
import launchStore from "./store"

// Difficulty settings/preset modes
const difficultyModes = [
	[Difficulty.Normal, "Normal"],
	[Difficulty.Expert, "Expert"],
	[Difficulty.Custom, "Custom"]
]

// Select difficulty component
@observer export default class SelectDifficulty extends React.Component {

	// Render component
	render() {

		return (
			<div id="selectDifficulty">
				<div>Realism</div>
				<ul id="difficultyPreset">
					{difficultyModes.map(([difficultyID, difficultyLabel]) => {

						const className = classNames("difficulty" + difficultyID, {
							selected: difficultyID === launchStore.difficulty
						})

						return (
							<li key={difficultyID} className={className}>
								<a onClick={() => this.onChangeDifficulty(difficultyID)}>{difficultyLabel}</a>
							</li>
						)
					})}
				</ul>
			</div>
		)
	}

	// Change difficulty event handler
	onChangeDifficulty(difficulty) {

		if (difficulty === launchStore.difficulty) {
			return
		}

		launchStore.setDifficulty(difficulty)
	}
}