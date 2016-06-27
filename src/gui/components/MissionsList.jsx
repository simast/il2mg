/** @copyright Simas Toleikis, 2016 */
"use strict";

const remote = require("electron").remote;
const React = require("react");
const {Link} = require("react-router");

// Missions list component
class MissionsList extends React.Component {
	
	constructor({missions, removeMission}) {
		super(...arguments);
		
		// Create context menu
		if (missions.length) {
			
			const {Menu, MenuItem} = remote;
			const menu = this.menu = new Menu();
			
			menu.append(new MenuItem({
				label: "Remove",
				click: () => {
					removeMission(true, this.contextMission.id);
				}
			}));
		}
	}
	
	componentDidMount() {
		
		// Scroll active/selected mission item into view (if needed)
		if (this.listElement) {
			
			const activeElement = this.listElement.querySelector(".selected");
			
			if (activeElement) {
				activeElement.scrollIntoViewIfNeeded();
			}
		}
	}
	
	// Render component
	render() {
		
		return (
			<ul id="missionsList" ref={(ref) => {this.listElement = ref;}}>
				{this.props.missions.map((mission) => {
					
					const props = {
						mission,
						onContextMenu: this.onContextMenu.bind(this)
					};
					
					return <MissionsList.Item key={mission.id} {...props} />;
				})}
			</ul>
		);
	}
	
	// Handle mission list context/popup menu
	onContextMenu(mission) {
		
		this.contextMission = mission;
		this.menu.popup(remote.getCurrentWindow());
	}
}

// Mission list item component
MissionsList.Item = ({mission, onContextMenu}) => {
	
	const linkProps = {
		to: "/missions/" + mission.id,
		activeClassName: "selected",
		onContextMenu() {
			onContextMenu(mission);
		},
		className: "country c" + mission.country
	};
	
	return (
		<li>
			<Link {...linkProps}>
				<em>{mission.plane}</em>
				{mission.title}
			</Link>
		</li>
	);
};

module.exports = MissionsList;