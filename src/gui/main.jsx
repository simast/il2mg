/** @copyright Simas Toleikis, 2016 */
"use strict";

const React = require("react");
const ReactDOM = require("react-dom");
const {Router, Route, IndexRedirect, hashHistory} = require("react-router");
const Application = require("./comp/Application");
const Missions = require("./comp/Missions");
const CreateMission = require("./comp/CreateMission");

// Render application
ReactDOM.render((
	<Router history={hashHistory}>
		<Route path="/" component={Application}>
			<IndexRedirect to="/missions" />
			<Route path="missions(/:mission)" component={Missions} />
			<Route path="create" component={CreateMission} />
		</Route>
	</Router>
), document.getElementById("main"));