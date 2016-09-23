/** @copyright Simas Toleikis, 2016 */
"use strict";

const {remote} = require("electron");
const React = require("react");

// Season color values
const seasonColor = {
	spring: "#a99a35",
	summer: "#8baa43",
	autumn: "#e89c3c",
	winter: "#9a9997"
};

// Style object reference (for date range input track CSS rule)
let trackCSSStyle = null;

// Select mission start and date component
class SelectStart extends React.Component {
	
	constructor({battle, start, startTypes, onStartChange}) {
		super(...arguments);
		
		// Create context menu for start type choice
		const {Menu, MenuItem} = remote;
		const startMenu = this.startMenu = new Menu();
		
		startTypes.forEach((startText, startID) => {
			
			startMenu.append(new MenuItem({
				label: startText[1],
				type: "radio",
				checked: (startID === start),
				click: () => {
					
					if (this.props.start !== startID) {
						onStartChange(startID);
					}
				}
			}));
		});
		
		this.state = {
			dates: this.getDates(battle)
		};
	}
	
	shouldComponentUpdate(nextProps) {
		
		// Update component only when date, battle or start type has changed
		return (nextProps.date !== this.props.date ||
						nextProps.battle !== this.props.battle ||
						nextProps.start !== this.props.start);
	}
	
	componentWillReceiveProps(nextProps) {
		
		// Rebuild dates index state when battle has changed
		if (nextProps.battle !== this.props.battle) {
			this.setState({dates: this.getDates(nextProps.battle)});
		}
	}
	
	// Render component
	render() {
		
		const {start, startTypes, date, onDateChange, onDateReset} = this.props;
		const {dates} = this.state;
		const totalDays = dates.list.length;
		const [startPrefix, startLabel] = startTypes.get(start);
		let dateValue = 0;
		let dateOutput;
		let reset;
		
		// Show a number of days in the battle when date is not selected
		if (!date) {
			dateOutput = totalDays + " days";
		}
		// Show selected date (and a reset button)
		else {
			
			dateOutput = date + ", " + dates.index[date].season;
			reset = <a className="reset" onClick={onDateReset}></a>;
		}
		
		const dateData = dates.index[date];
		
		if (dateData) {
			dateValue = dateData.value;
		}
		
		const startProps = {
			onClick: () => {
				this.startMenu.popup(remote.getCurrentWindow());
			}
		};
		
		// Trigger start context menu with both, right and left, mouse buttons
		startProps.onContextMenu = startProps.onClick;
		
		return (
			<div id="selectStart">
				<em>
					{"start "}
					{startPrefix + " "}
					<a {...startProps}>{startLabel.toLowerCase()}</a>, {dateOutput}
				</em>
				<input
					type="range"
					value={dateValue}
					max={totalDays}
					onChange={(event) => {
						
						// Get date from input value
						const dateData = dates.list[event.target.value - 1];
						onDateChange(dateData ? dateData.date : undefined);
					}} />
					{reset}
			</div>
		);
	}
	
	// Get an index of battle dates
	getDates(battle) {
		
		const dates = {
			list: [],
			index: {}
		};
		
		// Build a list of dates from season data
		for (const season in battle.seasons) {
			for (const date of battle.seasons[season]) {
				dates.list.push({date, season});
			}
		}
		
		// Sort dates in natural order
		dates.list.sort((a, b) => {
			return a.date.localeCompare(b.date);
		});
		
		const seasonRanges = [];
		let range;
		
		// Build date value index and season ranges
		dates.list.forEach((dateData, index) => {
			
			dateData.value = index + 1;
			dates.index[dateData.date] = dateData;
			
			// Make a new season range
			if (!range || dateData.season !== range.season) {
				
				range = {
					season: dateData.season,
					days: 0
				};
				
				seasonRanges.push(range);
			}
			
			// Track number of days in the season
			range.days++;
		});
		
		// Create a new "runnable track" pseudo CSS rule
		if (!trackCSSStyle) {
			
			const styleSheet = document.styleSheets[0];
			
			styleSheet.insertRule(
				"#selectStart input::-webkit-slider-runnable-track {}",
				0 // At the beginning of stylesheet
			);
			
			trackCSSStyle = styleSheet.cssRules[0].style;
		}
		
		const colorStops = [];
		const totalDays = dates.list.length;
		
		// NOTE: First slider value is "no value" (reserve gradient space)
		let lastStopPos = 100 / totalDays;
		
		// Build date slider gradient (based on seasons)
		for (range of seasonRanges) {
			
			const isFirst = (range === seasonRanges[0]);
			const isLast = (range === seasonRanges[seasonRanges.length - 1]);
			const stopPos = lastStopPos + (range.days / totalDays * 100);
			const stopColor = seasonColor[range.season];
			
			let stopStart = lastStopPos;
			let stopEnd = stopPos;
			
			if (!isFirst) {
				stopStart += 1.5;
			}
			
			if (!isLast) {
				stopEnd -= 1.5;
			}
			
			colorStops.push(stopColor + " " + stopStart + "%");
			colorStops.push(stopColor + " " + stopEnd + "%");
			
			lastStopPos = stopPos;
		}
		
		trackCSSStyle.backgroundImage = "linear-gradient(to right, " + colorStops.join(",") + ")";
		
		return dates;
	}
}

module.exports = SelectStart;