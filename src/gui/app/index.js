import {remote} from 'electron'
import fs from 'fs'

// Show error message dialog
export function showErrorMessage(message) {

	remote.dialog.showMessageBox(
		remote.getCurrentWindow(),
		{
			type: 'error',
			title: 'Error!',
			message,
			buttons: ['OK'],
			noLink: true
		}
	)
}

// Utility function used to move a file synchronously.
// NOTE: Prefers native Node.js fs.renameSync function, but will also handle
// "EXDEV" errors for cross device/disk renaming.
export function moveFileSync(sourceFile, destFile) {

	// Try to use fs.renameSync when possible
	try {
		fs.renameSync(sourceFile, destFile)
	}
	catch (e) {

		if (e.code !== 'EXDEV') {
			throw e
		}

		// Fallback to synchronous copy-and-delete logic
		fs.writeFileSync(destFile, fs.readFileSync(sourceFile))
		fs.unlinkSync(sourceFile)
	}
}
