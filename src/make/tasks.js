/** @copyright Simas Toleikis, 2015 */
"use strict";

// Generate available mission tasks
module.exports = function makeTasks() {

	// Tasks index table
	var tasks = Object.create(null);
	
	// Process all tasks and build index list
	for (var taskID in DATA.tasks) {

		var taskData = DATA.tasks[taskID];

		// Ignore dummy task definitions (and groups used to catalog tasks)
		if (!taskData || !taskData.name) {
			continue;
		}

		var task = Object.create(null);
		
		task.id = taskID;

		// Build task data and register parent/group hierarchy
		while (taskData) {

			// Collect/copy task data from current hierarchy
			for (var prop in taskData) {
				
				if (task[prop] === undefined) {
					task[prop] = taskData[prop];
				}
			}

			var taskParentID = taskData.parent;

			if (!taskParentID) {
				break;
			}
			// Set task group as a top-most parent
			else {
				task.group = taskParentID;
			}

			taskData = DATA.tasks[taskParentID];

			// Register task in the parent group hierarchy
			var taskGroup = tasks[taskParentID] || [];

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
	}

	// Static tasks index object
	this.tasks = Object.freeze(tasks);
};