/** @copyright Simas Toleikis, 2017 */
"use strict"

import React from "react"
import {observer} from "mobx-react"
import createMission from "./store"

// Select mission battle component
export default observer(() => {

	// TODO: Allow selecting other battles
	const {battle, battles} = createMission

	return (
		<h1>{battles[battle].name}</h1>
	)
})