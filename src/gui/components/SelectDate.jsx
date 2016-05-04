/** @copyright Simas Toleikis, 2016 */
"use strict";

const React = require("react");

// Select mission date component
class SelectDate extends React.Component {
	
	constructor(props) {
		super(...arguments);
		
		this.state = {
			dates: this.getDates(props.battle)
		};
	}
	
	shouldComponentUpdate(nextProps) {
		
		// Update component only when date or battle has changed
		return (nextProps.date !== this.props.date ||
						nextProps.battle !== this.props.battle);
	}
	
	componentWillReceiveProps(nextProps) {
		
		// Rebuild dates index state when battle has changed
		if (nextProps.battle !== this.props.battle) {
			this.setState({dates: this.getDates(nextProps.battle)});
		}
	}
	
	// Render component
	render() {
		
		const {date, onDateChange} = this.props;
		const {dates} = this.state;
		let dateOutput;
		
		// Show a number of days in the battle when date is not selected
		if (!date) {
			dateOutput = dates.values.length + " days";
		}
		// Show selected date
		else {
			dateOutput = date + ", " + dates.seasons[date];
		}
		
		return (
			<div id="selectDate">
				<em>{dateOutput}</em>
				<input
					type="range"
					defaultValue="-1"
					min="-1"
					max={dates.values.length - 1}
					onChange={(event) => {
						onDateChange(dates.values[event.target.value]);
					}} />
			</div>
		);
	}
	
	// Get an index of battle dates
	getDates(battle) {
		
		const {seasons} = battle;
		const dates = {
			values: [],
			seasons: {}
		};
		
		for (const season in seasons) {
			for (const date of seasons[season]) {
				
				dates.values.push(date);
				dates.seasons[date] = season;
			}
		}
		
		return dates;
	}
}

module.exports = SelectDate;