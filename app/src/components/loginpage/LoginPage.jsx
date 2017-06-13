import React, {Component} from 'react';
import TextField from 'material-ui/TextField';
import Drawer from 'material-ui/Drawer';
import RaisedButton from 'material-ui/RaisedButton';
import CheckBox from 'material-ui/Checkbox'

export default class LoginPage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            dm: false,
            room: ""
        }
    }

    render(){
        return (
            <Drawer>
                <div
                    style={{
                        padding: 50
                    }}
                >
                <TextField
                    hintText="Room"
                    onChange={(event)=>{
                        this.setState({...this.state, room: event.target.value})
                    }}
                />

                <CheckBox
                    checked={this.state.dm}
                    onCheck={()=>{
                        this.setState({...this.state, dm: !this.state.dm})
                    }}
                    style={{float: "right"}}
                />
                <br />
                <RaisedButton
                    label="Join"
                    onClick={()=>{
                        location.href = `/${this.state.dm?"dm":"room"}/${this.state.room}`
                    }}
                />
                </div>
            </Drawer>
        )
    }
}