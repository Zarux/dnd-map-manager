import React, {Component} from 'react';
import {BrowserRouter as Router, Route} from 'react-router-dom';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import {cyan500} from 'material-ui/styles/colors';
import DmPage from './dmpage/DmPage'
import PlayerPage from './playerpage/PlayerPage'
import LoginPage from './loginpage/LoginPage'


import injectTapEventPlugin from 'react-tap-event-plugin';
injectTapEventPlugin();


const appPalette = {
    primary1Color: "#1690DB",
    textColor: cyan500

};
const theme = getMuiTheme({
    palette: appPalette
});

export default class App extends Component{

    render() {
        return (
            <MuiThemeProvider muiTheme={theme}>
                <Router>
                    <div className="app">
                        <Route exact path="/" component={LoginPage}/>
                        <Route path="/dm/:room" component={DmPage}/>
                        <Route path="/room/:room" component={PlayerPage}/>
                    </div>
                </Router>
            </MuiThemeProvider>
        );
    }
}
