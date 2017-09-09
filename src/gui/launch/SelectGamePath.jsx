/** @copyright Simas Toleikis, 2017 */

import React from "react"
import {observer} from "mobx-react"
import launchStore from "./store"

// Select game path component
@observer export default class SelectGamePath extends React.Component {

	// Render component
	render() {

		return (
			<div>{launchStore.gamePath}</div>
		)
	}
}