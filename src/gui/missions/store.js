/** @copyright Simas Toleikis, 2017 */

import {remote} from "electron"
import {observable, action} from "mobx"

// Missions state store
class MissionsStore {

	// Missions directory path
	path = remote.getGlobal("config").missionsPath

	// Sorted list of mission objects
	@observable.ref list = []

	// Mission objects indexed by ID
	index = Object.create(null)

	@action setMissions(list, index) {

		this.list = list
		this.index = index
	}
}

export default new MissionsStore()