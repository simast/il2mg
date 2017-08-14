/** @copyright Simas Toleikis, 2017 */
"use strict"

const {remote} = require("electron")
const fs = require("fs")

// Show error message dialog
function showErrorMessage(message) {

	// Show error message dialog
	remote.dialog.showMessageBox(
		remote.getCurrentWindow(),
		{
			type: "error",
			title: "Error!",
			message,
			buttons: ["OK"],
			noLink: true
		}
	)
}

// Utility function used to move a file synchronously.
// NOTE: Prefers native Node.js fs.renameSync function, but will also handle
// "EXDEV" errors for cross device/disk renaming.
function moveFileSync(sourceFile, destFile) {

	// Try to use fs.renameSync when possible
	try {
		fs.renameSync(sourceFile, destFile)
	}
	catch (e) {

		if (e.code !== "EXDEV") {
			throw e
		}

		// Fallback to synchronous copy-and-delete logic
		fs.writeFileSync(destFile, fs.readFileSync(sourceFile))
		fs.unlinkSync(sourceFile)
	}
}

module.exports = {
	showErrorMessage,
	moveFileSync
}