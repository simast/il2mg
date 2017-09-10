/** @copyright Simas Toleikis, 2017 */

import React from "react"
import {observer} from "mobx-react"
import launchStore from "./store"
import {selectGamePath} from "./actions"

// Select game path component
export default observer(() => (
	<div id="selectGamePath">
		<a onClick={() => selectGamePath()}>
			{launchStore.gamePath || "Select IL-2 Sturmovik folder..."}
		</a>
	</div>
))