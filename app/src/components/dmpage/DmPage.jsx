import React, {Component} from 'react';
import socket from '../../socket'
import ImageArea from './ImageArea'
import DrawingBoard from './DrawingBoard'


export default class DmPage extends Component {
    constructor(props) {
        super(props);
        socket.emit("join-room",{
            room: this.props.match.params.room
        })
    }

    render(){
        const style = {
            display:"flex",
            flexDirection:"row",
            justifyContent: "space-around"
        };
        return (
            <div style={style}>
                <ImageArea />
                <DrawingBoard />
            </div>
        )
    }
}