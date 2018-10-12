import React from 'react'
import {restoreAutoPlay} from '../launch/actions'

// Application component
export default class Application extends React.Component {

	componentDidMount() {

		// Restore any existing autoplay.cfg file
		// NOTE: A workaround to fix leftover file in case of a program crash
		restoreAutoPlay()

		// Handle drag and drop events on application window
		document.addEventListener('dragover', Application.onDragAndDrop, true)
		document.addEventListener('drop', Application.onDragAndDrop, true)
	}

	// Render component
	render() {

		// NOTE: Router will provide child components
		return this.props.children
	}

	static onDragAndDrop(event) {

		// Disable file drag and drop for application window
		event.preventDefault()
		event.stopPropagation()
	}
}
