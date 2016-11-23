/** @copyright Simas Toleikis, 2016 */
"use strict";

const React = require("react");
const {remote, ipcRenderer} = global.require("electron");

// Application component
class Application extends React.Component {

	constructor() {
		super(...arguments);

		// Handle drag and drop events on application window
		document.addEventListener("dragover", Application.onDragAndDrop, true);
		document.addEventListener("drop", Application.onDragAndDrop, true);

		// FIXME: It's not clear why this is needed and why config object is not
		// automatically updated in the main process when new properties are added.
		window.addEventListener("unload", () => {
			ipcRenderer.sendSync("config", this.config);
		});

		this.config = remote.getGlobal("config");
		this.userDataPath = remote.app.getPath("userData");
	}

	getChildContext() {

		return {
			config: this.config,
			userDataPath: this.userDataPath
		};
	}

	// Render component
	render() {

		// NOTE: Router will provide child components
		return (
			<div id="application">
				{this.props.children}
			</div>
		);
	}

	static onDragAndDrop(event) {

		// Disable file drag and drop for application window
		event.preventDefault();
		event.stopPropagation();
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
		);
	}
}

Application.childContextTypes = {
	config: React.PropTypes.object,
	userDataPath: React.PropTypes.string
};

module.exports = Application;