/** @copyright Simas Toleikis, 2016 */
"use strict"

const React = require("react")
const {observable, action} = require("mobx")
const {observer} = require("mobx-react")

// Number of available photos
const AVAILABLE_PHOTOS = 12

// Photos decoration component
@observer class Photos extends React.Component {

	@observable.ref photos = []

	componentWillMount() {
		this.choosePhotos()
	}

	componentWillReceiveProps(nextProps) {

		// Update photo selection on screen change
		if (this.props.screen !== nextProps.screen) {
			this.choosePhotos()
		}
	}

	// Render component
	render() {

		return (
			<div id="photos">
				{this.photos.map((photoID, index) => (
					<div key={photoID} className={"photo " + this.props.screen + (index + 1)}>
						<img src={"assets/photo-" + photoID + ".jpg"} />
						<div></div>
					</div>
				))}
			</div>
		)
	}

	// Choose a set of active photos to display
	@action choosePhotos() {

		const photos = []

		// Choose two random photos
		while (photos.length < 2) {

			const photoID = 1 + Math.floor(Math.random() * AVAILABLE_PHOTOS)

			if (photos.indexOf(photoID) === -1) {
				photos.push(photoID)
			}
		}

		this.photos = photos
	}
}

module.exports = Photos