import React, {Component} from 'react';
import socket from '../../socket'
import ImageArea from './ImageArea'
import DrawingBoard from './DrawingBoard'


export default class DmPage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            drawerOpen: false
        };
        socket.emit("join-room",{
            room: this.props.match.params.room
        })
    }

    openDrawer = () => {
        this.setState({...this.state, drawerOpen: true})
    };

    closeDrawer = (status) => {
        this.setState({...this.state, drawerOpen: status})
    };

    render(){
        const style = {
            display:"flex",
            flexDirection:"row",
            justifyContent: "space-around"
        };
        return (
            <div style={style}>
                <ImageArea drawerOpen={this.state.drawerOpen}  closeDrawer={this.closeDrawer}/>
                <DrawingBoard openDrawer={this.openDrawer}/>
            </div>
        )
    }
}