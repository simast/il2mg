/** @copyright Simas Toleikis, 2015 */
"use strict";

// Generate available mission tasks
module.exports = function makeTasks() {

	// Tasks index table and weighted list
	const tasks = Object.create(null);
	const tasksWeighted = [];
	
	// Process all tasks and build index list
	for (const taskID in DATA.tasks) {

		let taskData = DATA.tasks[taskID];

		// Ignore dummy task definitions (and groups used to catalog tasks)
		if (!taskData || !taskData.name) {
			continue;
		}

		const task = Object.create(null);
		
		task.id = taskID;

		// Build task data and register parent/group hierarchy
		while (taskData) {

			// Collect/copy task data from current hierarchy
			for (const prop in taskData) {
				
				if (task[prop] === undefined) {
					task[prop] = taskData[prop];
				}
			}

			const taskParentID = taskData.parent;

			if (!taskParentID) {
				break;
			}
			// Set task group as a top-most parent
			else {
				task.group = taskParentID;
			}

			taskData = DATA.tasks[taskParentID];

			// Register task in the parent group hierarchy
			const taskGroup = tasks[taskParentID] || [];

			// Register a new child task in the task group
			if (Array.isArray(taskGroup)) {

				taskGroup.push(taskID);

				if (taskData.parent !== undefined) {
					taskGroup.parent = taskData.parent;
				}

				tasks[taskParentID] = taskGroup;
			}
		}

		// Register task to ID index
		tasks[taskID] = task;
		
		// Add task to weighted list
		const weight = +task.weight || 1;
		
		for (let i = 0; i < weight; i++) {
			tasksWeighted.push(taskID);
		}
	}
	
	// Static tasks index and weighted list
	this.tasks = Object.freeze(tasks);
	this.tasksWeighted = Object.freeze(tasksWeighted);
};