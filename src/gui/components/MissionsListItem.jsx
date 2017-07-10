/** @copyright Simas Toleikis, 2017 */
"use strict"

const React = require("react")
const {NavLink} = require("react-router-dom")

// Mission list item component
module.exports = ({mission, onContextMenu}) => {

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