/** @copyright Simas Toleikis, 2016 */
"use strict"

const fs = global.require("fs")
const {remote, ipcRenderer} = global.require("electron")
const React = require("react")
const PropTypes = require("prop-types")

// Application component
class Application extends React.Component {

	constructor() {
		super(...arguments)

		// Handle drag and drop events on application window
		document.addEventListener("dragover", Application.onDragAndDrop, true)
		document.addEventListener("drop", Application.onDragAndDrop, true)

		// FIXME: It's not clear why this is needed and why config object is not
		// automatically updated in the main process when new properties are added.
		window.addEventListener("unload", () => {
			ipcRenderer.sendSync("config", this.config)
		})

		this.config = remote.getGlobal("config")
		this.userDataPath = remote.app.getPath("userData")
	}

	getChildContext() {

		return {
			config: this.config,
			userDataPath: this.userDataPath
		}
	}

	// Render component
	render() {

		// NOTE: Router will provide child components
		return (
			<div id="application">
				{this.props.children}
			</div>
		)
	}

	static onDragAndDrop(event) {

		// Disable file drag and drop for application window
		event.preventDefault()
		event.stopPropagation()
	}

	// Show error message dialog
	static showErrorMessage(message) {

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
	static moveFileSync(sourceFile, destFile) {

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
}

Application.childContextTypes = {
	config: PropTypes.object,
	userDataPath: PropTypes.string
}

module.exports = Application