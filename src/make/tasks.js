/** @copyright Simas Toleikis, 2015 */
"use strict";

// Generate available mission tasks
module.exports = function makeTasks() {

	// Tasks index list
	const tasks = Object.create(null);
	
	// Process all tasks and build index list
	for (const taskID in DATA.tasks) {

		const task = DATA.tasks[taskID];
		
		// Ignore dummy task definitions
		if (!task || !task.name) {
			continue;
		}
		
		task.id = taskID;

		// Register task to ID index
		tasks[taskID] = task;
	}
	
	// Static cached unit tasks lists
	// TODO: Support dynamic lists with rebase missions
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
					
					weight = roleTask;
					roleTask = Object.create(task);
					roleTask.weight = weight;
				}
				// Role task data set as an object for customizing base task
				else {
					
					weight = roleTask.weight = roleTask.weight || 1;
					Object.setPrototypeOf(roleTask, task);
				}
				
				// Add task to the weighted role tasks list
				for (let i = 0; i < weight; i++) {
					unitTasks.push(roleTask);
				}
			}
		}
		
		unit.tasks = unitTasks;
	}
	
	// Static tasks index list
	this.tasks = Object.freeze(tasks);
};