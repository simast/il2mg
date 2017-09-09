/** @copyright Simas Toleikis, 2016 */

import React from "react"
import ActionBar from "./ActionBar"
import Photos from "./Photos"

// Screen component
export default ({id, children, actions, disabled = false}) => (
	<div id="screen" className={disabled ? "disabled" : undefined}>
		<Photos screen={id} />
		<div id="container">
			<div id="content">
				<div id={id}>
					{children}
				</div>
			</div>
			<ActionBar actions={actions} />
		</div>
	</div>
)