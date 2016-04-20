/** @copyright Simas Toleikis, 2016 */
"use strict";

const React = require("react");
const {remote} = require("electron");

// Application component
class Application extends React.Component {
	
	constructor(props) {
		super(...arguments);
		
		document.addEventListener("dragover", Application.onDragAndDrop, true);
		document.addEventListener("drop", Application.onDragAndDrop, true);
		
		this.config = remote.getGlobal("config");
	}
	
	getChildContext() {
		
		return {
			config: this.config
		}
	}
	
	// Disable file drag and drop for application window
	static onDragAndDrop(event) {
		
		event.preventDefault();
		event.stopPropagation();
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
};

Application.childContextTypes = {
	config: React.PropTypes.object
};

module.exports = Application;