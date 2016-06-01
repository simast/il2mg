/** @copyright Simas Toleikis, 2015 */
"use strict";

const data = require("../data");

// Generate available mission tasks
module.exports = function makeTasks() {

	// Index list for base/static tasks
	const tasks = Object.create(null);
	
	// Process all tasks and build index list
	for (const taskID in data.tasks) {

		const task = data.tasks[taskID];
		
		// Ignore dummy task definitions
		if (!task || !task.name) {
			continue;
		}
		
		task.id = taskID;

		// Register task to ID index
		tasks[taskID] = task;
	}
	
	// Static cached unit tasks lists
	const tasksByRole = Object.create(null);
	
	// Build unit tasks lists
	for (const unitID in this.units) {
		
		const unit = this.units[unitID];
		
		// Ignore unit groups
		if (Array.isArray(unit)) {
			continue;
		}
		
		const countryID = unit.country;
		
		tasksByRole[countryID] = tasksByRole[countryID] || Object.create(null);
		let unitTasks = tasksByRole[countryID][unit.role];
		
		// Create a new unit tasks list for this role
		if (!unitTasks) {
			
			unitTasks = tasksByRole[countryID][unit.role] = [];
			const role = this.battle.roles[countryID][unit.role];
			
			for (const taskID in role) {
				
				const task = tasks[taskID];
				let roleTask = role[taskID];
				
				// Ignore invalid roles
				if (!task || !roleTask) {
					continue;
				}
				
				let weight;
				
				// Role task data set as a single weight number
				if (Number.isInteger(roleTask)) {
					
					weight = Math.max(roleTask, 1);
					roleTask = Object.create(task);
					roleTask.weight = weight;
				}
				// Role task data set as an object for customizing base task
				else {
					
					weight = roleTask.weight = roleTask.weight || 1;
					Object.setPrototypeOf(roleTask, task);
				}
				
				roleTask = Object.freeze(roleTask);
				
				// Add task to the weighted role tasks list
				for (let i = 0; i < weight; i++) {
					unitTasks.push(roleTask);
				}
			}
		}
		
		// Add rebase task (as a ~50% of total task weight)
		if (unit.rebase) {
			
			unitTasks = unitTasks.slice();
			
			const rebaseTask = Object.create(tasks.rebase);
			rebaseTask.weight = unitTasks.length || 1;
			
			for (let i = 0; i < rebaseTask.weight; i++) {
				unitTasks.push(rebaseTask);
			}
		}
		
		unit.tasks = unitTasks;
	}
	
	this.tasks = Object.freeze(tasks);
};