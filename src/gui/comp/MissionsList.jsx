/** @copyright Simas Toleikis, 2016 */
"use strict";

const React = require("react");
const {Link} = require("react-router");

// Missions list component
class MissionsList extends React.Component {
	
	// Render component
	render() {
		return (
			<ul>
				{this.props.missions.map((mission) => {
					return <MissionsList.Item key={mission.id} mission={mission} />
				})}
			</ul>
		);
	}
};

MissionsList.propTypes = {
	missions: React.PropTypes.arrayOf(React.PropTypes.object).isRequired
};

// Mission list item component
MissionsList.Item = ({mission}) => {
	
	return (
		<li>
			<Link to={"/missions/" + mission.id} activeClassName="active">
				{mission.title} ({mission.plane})
			</Link>
		</li>
	);
};

module.exports = MissionsList;