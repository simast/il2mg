/** @copyright Simas Toleikis, 2016 */
"use strict";

const React = require("react");
const {remote, ipcRenderer} = require("electron");

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
	}
	
	getChildContext() {
		
		return {
			config: this.config
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
}

Application.childContextTypes = {
	config: React.PropTypes.object
};

module.exports = Application;