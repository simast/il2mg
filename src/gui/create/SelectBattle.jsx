import React from "react"
import {observer} from "mobx-react"
import createStore from "./store"

// Select mission battle component
export default observer(() => {

	// TODO: Allow selecting other battles
	const {battle, battles} = createStore

	return (
		<h1>{battles[battle].name}</h1>
	)
})