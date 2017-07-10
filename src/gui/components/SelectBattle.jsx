/** @copyright Simas Toleikis, 2017 */
"use strict"

const React = require("react")
const {observer} = require("mobx-react")
const createMission = require("../stores/createMission")

// Select mission battle component
module.exports = observer(() => {

	// TODO: Allow selecting other battles
	const {battle, battles} = createMission

	return (
		<h1>{battles[battle].name}</h1>
	)
})