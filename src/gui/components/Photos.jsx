/** @copyright Simas Toleikis, 2016 */
"use strict";

const React = require("react");

// Number of available photos
const AVAILABLE_PHOTOS = 12;

// Photos decoration component
class Photos extends React.Component {

	constructor() {
		super(...arguments);

		this.state = {
			photos: []
		};
	}

	componentWillMount() {
		this.choosePhotos();
	}

	componentWillReceiveProps(nextProps) {

		// Update photo selection on screen change
		if (this.props.screen !== nextProps.screen) {
			this.choosePhotos();
		}
	}

	shouldComponentUpdate(nextProps) {

		// Update component only on screen change
		return (this.props.screen !== nextProps.screen);
	}

	// Render component
	render() {

		let i = 1;

		// TODO: Preload other photos as hidden images

		return (
			<div id="photos">
				{this.state.photos.map((photoID) => {
					return (
						<div key={photoID} className={"photo " + this.props.screen + (i++)}>
							<img src={"assets/photo-" + photoID + ".jpg"} />
							<div></div>
						</div>
					);
				})}
			</div>
		);
	}

	// Choose a set of active photos to display
	choosePhotos() {

		const photos = [];

		// Choose two random photos
		while (photos.length < 2) {

			const photoID = 1 + Math.floor(Math.random() * AVAILABLE_PHOTOS);

			if (photos.indexOf(photoID) === -1) {
				photos.push(photoID);
			}
		}

		this.setState({photos});
	}
}

module.exports = Photos;