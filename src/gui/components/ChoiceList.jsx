/** @copyright Simas Toleikis, 2016 */
"use strict";

const React = require("react");

// Data choice list component
class ChoiceList extends React.Component {
	
	// Render component
	render() {
		
		const {type, title, choices, onChoiceClick, onChoiceReset} = this.props;
		let validCount = 0;
		let selectedCount = 0;
		let valid;
		let reset;
		
		// Build a list of choice item elements to render
		const items = choices.map((choice) => {
			
			if (choice.valid || choice.selected) {
				validCount++;
			}
			
			if (choice.selected) {
				selectedCount++;
			}
			
			return (
				<ChoiceList.Item
					key={choice.id.join("")}
					choice={choice}
					onChoiceClick={onChoiceClick} />
			);
		});
		
		if (validCount > 0) {
			
			let validNum = validCount;
			
			// Use bold font weight to show selected count number
			if (validNum === selectedCount) {
				validNum = <b>{validNum}</b>;
			}
			
			valid = <span>{validNum}</span>;
		}
		
		if (selectedCount > 0) {
			reset = <a onClick={onChoiceReset}>✖</a>;
		}
		
		return (
			<div className={"choiceList " + type}>
				<h2>{title}{valid}{reset}</h2>
				<ul>{items}</ul>
			</div>
		);
	}
}

// Data choice list item component
ChoiceList.Item = ({choice, onChoiceClick}) => {
	
	const data = choice.data;
	let suffix, alias;
	
	if (data.suffix) {
		suffix = <span>{" " + data.suffix}</span>;
	}
	
	if (data.alias) {
		alias = <em>{" “" + data.alias + "”"}</em>;
	}
	
	const propsItem = {};
	const propsLink = {
		onClick: () => {
			onChoiceClick(choice.id);
		}
	};
	
	const className = [];
	
	if (data.country) {
		className.push("country", "c" + data.country);
	}
	
	if (choice.selected) {
		className.push("selected");
	}
	else if (!choice.valid) {
		propsItem.className = "invalid";
	}
	
	if (className.length) {
		propsLink.className = className.join(" ");
	}
	
	return (
		<li {...propsItem}>
			<a {...propsLink}>{data.name}{suffix}{alias}</a>
		</li>
	);
};

module.exports = ChoiceList;