/** @copyright Simas Toleikis, 2016 */
"use strict";

const path = global.require("path");
const execFileSync = global.require("child_process").execFileSync;
const React = require("react");
const Application = require("./Application");
const Screen = require("./Screen");
const SelectDate = require("./SelectDate");
const ChoiceList = require("./ChoiceList");

// Record key data parameter separator
const RECORD_SEP = "~";

// Multiple param values separator (as OR choice)
const PARAM_SEP = ",";

// List of record key data parameters
const recordParams = [
	["country", "countries"],
	["unit", "units"],
	["plane", "planes"],
	["airfield", "airfields"],
	["task", "tasks"]
];

// Available battle data choice lists
const choiceLists = [
	["unit", "Units"],
	["plane", "Aircraft"],
	["task", "Tasks"],
	["airfield", "Airfields"]
];

// Data index for all supported battles
const battles = {
	stalingrad: require("../../../data/battles/stalingrad")
};

// Create mission screen component
class CreateMission extends React.Component {
	
	constructor() {
		super(...arguments);
		
		// Initial state
		this.state = {
			battle: Object.keys(battles).pop(), // Set first battle as active
			choice: {}
		};
	}
	
	// Render component
	render() {
		
		const {battle, date} = this.state;
		const {router} = this.context;
		const actions = {
			right: new Map()
		};
		
		// Get mission choice data
		const choices = this.getChoices();
		
		const createProps = {};
		
		if (choices.valid) {
			createProps.onClick = this.onCreateClick.bind(this);
		}
		// Show create action button in a disabled state
		else {
			createProps.disabled = true;
		}
		
		// Create mission
		actions.right.set("Create", createProps);
		
		// Cancel create mission
		if (!this.props.location.query.first) {
			
			actions.right.set("Cancel", {
				onClick() {
					router.goBack();
				}
			});
		}
		
		return (
			<Screen id="create" actions={actions}>
				<CreateMission.SelectBattle battle={battle} battles={battles} />
				<SelectDate
					battle={battles[battle]}
					date={date}
					onDateChange={(date) => {
						this.setState({date});
					}}
					onDateReset={() => {
						this.setState({date: undefined});
					}} />
				<div id="choices">
					{choiceLists.map(([type, title]) => {
						
						const props = {
							key: type,
							type,
							title,
							choices: choices[type],
							onChoiceClick: (choices) => {
								this.onChoiceClick(type, choices);
							},
							onChoiceReset: () => {
								this.onChoiceReset(type);
							}
						};
						
						return <ChoiceList {...props} />;
					})}
				</div>
			</Screen>
		);
	}
	
	// Get mission choice data
	getChoices() {
		
		const choices = Object.create(null);
		const {battle, date, choice} = this.state;
		const battleData = battles[battle];
		let scanRegExp = (Object.keys(choice).length > 0);
		
		// Build regular expression object used to scan battle index records
		if (scanRegExp) {
			
			scanRegExp = [];
			
			recordParams.forEach(([param]) => {
				
				const choiceData = choice[param];
				
				// No specific choice on this data param
				if (choiceData === undefined) {
					scanRegExp.push(".+?");
				}
				else {
					scanRegExp.push("(?:" + choiceData.join("|") + ")");
				}
			});
			
			scanRegExp = new RegExp("^" + scanRegExp.join(RECORD_SEP) + "$");
		}
		
		// Scan for valid battle data index records
		for (const record in battleData.records) {
			
			const recordID = battleData.records[record];
			
			// TODO: Filter records with air/ground start
			if (recordID < 0) {
				continue;
			}
			
			let isValid = true;
			
			// Validate date
			if (date) {
				isValid = (battleData.dates[date].indexOf(recordID) > -1);
			}
			
			// Validate choices
			if (isValid && scanRegExp) {
				isValid = scanRegExp.test(record);
			}
			
			const recordData = record.split(RECORD_SEP);
			
			// Build player choices
			recordParams.forEach(([param, paramData], paramIndex) => {
				
				if (!choices[param]) {
					choices[param] = Object.create(null);
				}
				
				const paramID = recordData[paramIndex];
				let item = choices[param][paramID];
				
				if (!item) {
					
					item = choices[param][paramID] = Object.create(null);
					
					item.id = [paramID];
					item.valid = isValid;
					
					const choiceData = battleData[paramData][paramID];
					
					// Choice data as a single string (name only)
					if (typeof choiceData === "string") {
						item.data = {name: choiceData};
					}
					// Choice data as an object
					else {
						item.data = choiceData;
					}
					
					// Mark data choice item as selected
					if (choice[param] && choice[param].indexOf(paramID) > -1) {
						item.selected = true;
					}
				}
				
				// Mark data choice item as valid
				if (isValid) {
					item.valid = true;
				}
			});
		}
		
		const data = Object.create(null);
		
		// Flag used to mark choice data selection as valid/invalid
		data.valid = true;
		
		// Convert choice hash maps into arrays
		for (const choiceType in choices) {
			
			const nameIndex = Object.create(null);
			const items = data[choiceType] = [];
			let isValid = false;
			
			for (const choiceID in choices[choiceType]) {
				
				const choice = choices[choiceType][choiceID];
				
				if (!isValid && choice.valid) {
					isValid = true;
				}
				
				// Build choice full name
				const {name, suffix, alias} = choice.data;
				let indexName = [name];
				
				if (suffix) {
					indexName.push(suffix);
				}
				
				if (alias) {
					indexName.push(alias);
				}
				
				indexName = indexName.join(" ");
				
				// Merge choice items with the same name into one selection
				if (nameIndex[indexName]) {
					
					const idList = nameIndex[indexName].id;
					idList.push.apply(idList, choice.id);
				}
				else {
					
					nameIndex[indexName] = choice;
					items.push(choice);
				}
			}
			
			// Sort items by data ID
			if (choiceType !== "unit") {
				
				items.sort((a, b) => {
					return a.id[0].localeCompare(b.id[0]);
				});
			}
			
			// Invalid data choice selection
			if (!isValid) {
				data.valid = false;
			}
		}
		
		return data;
	}
	
	// Handle item click in data choice list
	onChoiceClick(choiceType, choices) {
		
		const choiceState = Object.assign({}, this.state.choice);
		
		// NOTE: Multiple choices can be passed in (from merged data items)
		for (const choice of choices) {
			
			let foundChoice = -1;

			// Try to remove existing choice
			if (choiceState[choiceType]) {
				
				foundChoice = choiceState[choiceType].indexOf(choice);
				
				if (foundChoice > -1) {
					
					choiceState[choiceType].splice(foundChoice, 1);
					
					// Remove empty choice list
					if (!choiceState[choiceType].length) {
						delete choiceState[choiceType];
					}
				}
			}
			
			// Add new choice
			if (foundChoice === -1) {
				
				if (!choiceState[choiceType]) {
					choiceState[choiceType] = [];
				}
				
				choiceState[choiceType].push(choice);
			}
		}
		
		this.setState({choice: choiceState});
	}
	
	// Handle choice reset button click in data choice list
	onChoiceReset(type) {
		
		const choiceState = Object.assign({}, this.state.choice);
		
		delete choiceState[type];
		this.setState({choice: choiceState});
	}
	
	// Handle create mission button click
	onCreateClick() {
		
		const {config, router} = this.context;
		const {battle, date, choice} = this.state;
		
		let cliFile = path.join(process.resourcesPath, "il2mg-cli");
		const cliParams = [];
		
		// Use node process and debug mode while in development environment
		if (process.env.NODE_ENV !== "production") {
			
			cliFile = "node";
			cliParams.push(".", "--debug");
		}
		
		cliParams.push(
			"--quiet", // Use quite mode (with error output only and no colors)
			"--meta", // Generate metadata .il2mg file
			"--format", "binary", // TODO: Set mission file format from options
			"--batle", battle
		);
		
		// Set selected date
		if (date) {
			cliParams.push("--date", date);
		}
		
		// Set data choices
		for (const param in choice) {
			cliParams.push("--" + param, choice[param].join(PARAM_SEP));
		}
		
		// Mission files path
		cliParams.push(config.missionsPath);
		
		// Create mission using CLI application
		try {
			
			execFileSync(cliFile, cliParams, {
				stdio: ["ignore", "ignore", "pipe"]
			});
			
			router.replace("/missions");
		}
		catch (e) {
			Application.showErrorMessage(e.stderr.toString());
		}
	}
}

CreateMission.contextTypes = {
	router: React.PropTypes.object.isRequired,
	config: React.PropTypes.object.isRequired
};

// Mission battle selection component
CreateMission.SelectBattle = ({battle, battles}) => {
	
	// TODO: Allow selecting other battles
	return <h1>{battles[battle].name}</h1>;
};

module.exports = CreateMission;