/** @copyright Simas Toleikis, 2015 */

import data from "../data"

// Generate available mission tasks
export default function makeTasks() {

	// Index list for base/static tasks
	const tasks = Object.create(null)

	// Process all tasks and build index list
	for (const taskID in data.tasks) {

		const task = data.tasks[taskID]

		// Ignore dummy task definitions
		if (!task || !task.name) {
			continue
		}

		// Register task to ID index
		tasks[taskID] = Object.assign({}, task, {
			id: taskID
		})
	}

	// Build unit tasks lists
	for (const unitID in this.units) {

		const unit = this.units[unitID]

		// Ignore unit groups
		if (Array.isArray(unit)) {
			continue
		}

		const countryID = unit.country
		const role = this.battle.roles[countryID][unit.role]
		const unitTasks = []
		const airfield = this.airfields[unit.airfield]

		// Build tasks list only when unit is available
		// NOTE: Special 0 availability is valid for rebase tasks (see below)
		if (unit.availability > 0) {

			for (const taskID in role) {

				const task = tasks[taskID]
				let roleTask = role[taskID]

				// Ignore invalid roles
				if (!task || !roleTask) {
					continue
				}

				// Validate task offmap support
				if (airfield.offmap && !task.offmap) {
					continue
				}

				let weight

				// Role task data set as a single weight number
				if (Number.isInteger(roleTask)) {

					weight = Math.max(roleTask, 1)
					roleTask = Object.create(task)
					roleTask.weight = weight
				}
				// Role task data set as an object for customizing base task
				else {

					weight = roleTask.weight = roleTask.weight || 1
					Object.setPrototypeOf(roleTask, task)
				}

				roleTask = Object.freeze(roleTask)

				// Add task to the weighted unit tasks list
				for (let i = 0; i < weight; i++) {
					unitTasks.push(roleTask)
				}
			}
		}

		// Add rebase task (as a minimum ~75% of total task weight)
		if (unit.rebase) {

			const rebaseTask = Object.create(tasks.rebase)

			rebaseTask.weight = 1

			if (unitTasks.length) {
				rebaseTask.weight = Math.round(unitTasks.length * 3)
			}

			for (let i = 0; i < rebaseTask.weight; i++) {
				unitTasks.push(rebaseTask)
			}
		}

		unit.tasks = unitTasks
	}

	this.tasks = Object.freeze(tasks)
}