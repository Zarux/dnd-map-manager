import React, {Component} from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import socket from '../../socket'
import {GridList, GridTile} from 'material-ui/GridList';

export default class ImagePicker extends Component{

    constructor(props) {
        super(props);
        this.state = {
            images: []
        };

        socket.on("thumbnails", data => {
            console.log("Got thumbnails");
            this.setState({...this.state, images: data.images})
        });
        socket.on("file-saved", data => {
            socket.emit("get-thumbnails");
        })
    }

    componentDidMount(){
        socket.on("joined-room", () => {
            console.log("Joined room");
            console.log("Requesting thumbnails");
            socket.emit("get-thumbnails");
        })

    }

    render(){
        return (
            <GridList
                cellHeight={160}
                style={{
                    padding: 30
                }}
            >
                {this.state.images.map((tile, i) => (
                    <GridTile
                        key={i}
                        title={tile.name}
                        actionIcon={
                            <RaisedButton
                                primary={true}
                                style={{margin:5}}
                                onClick={
                                    ()=> {
                                        socket.emit("get-full-image",
                                            {
                                                name: tile.name,
                                                cached: sessionStorage.getItem(tile.name)
                                            });
                                    }
                                }
                            >
                                Use
                            </RaisedButton>
                        }
                    >
                        <img src={`data:image/jpeg;base64,${tile.image}`} />
                    </GridTile>
                ))}
            </GridList>
        )
    }
}