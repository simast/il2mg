/** @copyright Simas Toleikis, 2017 */

import React from "react"
import {reaction} from "mobx"
import {observer} from "mobx-react"
import launchStore from "./store"
import {readRealismOptions} from "./actions"

// Custom realism options component
@observer export default class RealismOptions extends React.Component {

	componentWillMount() {

		// Read/reset realism options
		this.disposeReaction = reaction(
			() => launchStore.gamePath,
			() => {

				if (!launchStore.realismOptions) {
					launchStore.setRealismOptions(readRealismOptions())
				}
			},
			true // Run immediately
		)
	}

	componentWillUnmount() {

		if (this.disposeReaction) {
			this.disposeReaction()
		}
	}

	// Render component
	render() {

		if (!launchStore.realismOptions) {
			return null
		}

		return (
			<div id="realismOptions">
				TODO
			</div>
		)
	}
}