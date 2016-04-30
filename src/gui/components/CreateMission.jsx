/** @copyright Simas Toleikis, 2016 */
"use strict";

const path = global.require("path");
const execFileSync = global.require("child_process").execFileSync;
const React = require("react");
const Application = require("./Application");
const Screen = require("./Screen");

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
			battle: Object.keys(battles).pop() // Set first battle as active
		};
	}
	
	// Render component
	render() {
		
		const {battle} = this.state;
		const {router} = this.context;
		const actions = {
			right: new Map()
		};
		
		// Create mission
		actions.right.set("Create", {
			onClick: this.onCreateClick.bind(this)
		});
		
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
				<CreateMission.Battle battle={battle} battles={battles} />
				<CreateMission.Choice title="Units" />
				<CreateMission.Choice title="Aircraft" />
				<CreateMission.Choice title="Tasks" />
				<CreateMission.Choice title="Airfields" />
			</Screen>
		);
	}
	
	// Handle create mission button click
	onCreateClick() {
		
		const {config, router} = this.context;
		
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
			config.missionsPath
		);
		
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
CreateMission.Battle = ({battle, battles}) => {
	
	// TODO: Allow selecting other battles
	return <h1>{battles[battle].name}</h1>;
};

// Mission data choice component
CreateMission.Choice = ({title}) => {
	
	// TODO:
	return <h2>{title}</h2>;
};

module.exports = CreateMission;