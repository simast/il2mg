/** @copyright Simas Toleikis, 2016 */
"use strict"

const React = require("react")

// Application component
class Application extends React.Component {

	componentDidMount() {

		// Handle drag and drop events on application window
		document.addEventListener("dragover", Application.onDragAndDrop, true)
		document.addEventListener("drop", Application.onDragAndDrop, true)
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
}

module.exports = Application