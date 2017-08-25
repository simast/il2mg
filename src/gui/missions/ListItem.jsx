/** @copyright Simas Toleikis, 2017 */

import React from "react"
import {NavLink} from "react-router-dom"

// Mission list item component
export default ({mission, onContextMenu}) => {

	const linkProps = {
		to: "/missions/" + mission.id,
		activeClassName: "selected",
		onContextMenu: () => {
			onContextMenu(mission)
		},
		className: "country c" + mission.country
	}

	return (
		<li>
			<NavLink {...linkProps}>
				<em>{mission.plane}</em>
				{mission.title}
			</NavLink>
		</li>
	)
}