import React, {Component} from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import IconButton from 'material-ui/IconButton'
import socket from '../../socket'
import {GridList, GridTile} from 'material-ui/GridList';
import Delete from 'material-ui-icons/Delete'
import Input from 'material-ui-icons/Input'
import Save from 'material-ui-icons/Save'
import TextField from 'material-ui/TextField';

export default class ImagePicker extends Component{

    constructor(props) {
        super(props);
        this.state = {
            images: [],
            tileNames: {}
        };

        socket.on("thumbnails", data => {
            console.log("Got thumbnails");
            const tileNames = {};
            data.images.forEach(elem => {
               tileNames[elem.id] = elem.name;
            });

            this.setState({...this.state, images: data.images, tileNames: tileNames})
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
                        key={tile.id}
                        title={
                            <TextField
                                id={`textinput_${tile.id}`}
                                disabled={tile.id === 0 || tile.id === "0"}
                                value={this.state.tileNames[tile.id]}
                                onChange={event => {
                                    const tileNames = this.state.tileNames;
                                    tileNames[tile.id] = event.target.value;
                                    this.setState({...this.state, tileNames: tileNames})
                                }}

                            />
                        }
                        titleStyle={{
                            width: 100
                        }}
                        actionIcon={
                            <div>
                                <IconButton
                                    tooltip="Save name"
                                    tooltipPosition="top-left"
                                    disabled={tile.id === 0 || tile.id === "0"}
                                    onClick={()=> {
                                        socket.emit("change-name", {id:tile.id, name: this.state.tileNames[tile.id]});
                                    }}
                                >
                                    <Save/>
                                </IconButton>
                                <IconButton
                                    tooltip="Use"
                                    tooltipPosition="top-left"
                                    onClick={()=> {
                                        socket.emit("get-full-image", {id: tile.id, cached: false});
                                    }}
                                >
                                    <Input/>
                                </IconButton>
                                <IconButton
                                    tooltip="Delete"
                                    tooltipPosition="top-left"
                                    style={{
                                        color:"red",
                                        marginLeft: 30
                                    }}
                                    disabled={tile.id === 0 || tile.id === "0"}
                                    onClick = {() => {
                                        if(confirm("Are you sure you want to delete image?")){
                                            socket.emit("delete-image", tile.id)
                                        }
                                    }}
                                >
                                    <Delete />
                                </IconButton>
                            </div>
                        }
                    >
                        <img src={`data:image/jpeg;base64,${tile.image}`} />
                    </GridTile>
                ))}
            </GridList>
        )
    }
}