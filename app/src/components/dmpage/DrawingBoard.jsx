import React, {Component} from 'react';
import {Toolbar, ToolbarGroup, ToolbarSeparator} from 'material-ui/Toolbar';
import RaisedButton from 'material-ui/RaisedButton';
import FlatButton from "material-ui/FlatButton";
import Slider from "material-ui/Slider";
import Popover from "material-ui/Popover";
import socket from '../../socket'
import {CompactPicker} from "react-color";
import CropDin from 'material-ui-icons/CropDin';
import ChangeHistory from 'material-ui-icons/ChangeHistory';
import PanoramaFishEye from 'material-ui-icons/PanoramaFishEye';
import CheckBox from 'material-ui/Checkbox'
import GridOn from 'material-ui-icons/GridOn';
import GridOff from 'material-ui-icons/GridOff';
import Edit from 'material-ui-icons/Edit';
import OpenWith from 'material-ui-icons/OpenWith';
import Palette from 'material-ui-icons/Palette';
import Panorama from 'material-ui-icons/Panorama'
import Publish from 'material-ui-icons/Publish'
import Clear from 'material-ui-icons/Clear'
import Save from 'material-ui-icons/Save'

export default class DrawingBoard extends Component {
    constructor(props) {
        super(props);
        this.state = {
            cellWidth : 50,
            fillColor: null,
            showColor: false,
            gridOnIcon: false,
            sizeSliderOpen: false,
            penSize: 10
        }
    }
    resizeCanvas = () =>{
        this.canvas.setHeight(window.innerHeight - (window.innerHeight / 8));
        this.canvas.setWidth(window.innerWidth);
        this.canvas.renderAll.bind(this.canvas)();
    };
    gridOn = false;
    gridObjects = [];

    dataURItoBlob = dataURI => {
        const byteString = atob(dataURI.split(',')[1]);
        const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        return new Blob([ab], {type: mimeString});
    };

    saveCanvas = () => {
        console.log("Saving canvas");
        socket.emit("save-images",
            {files: [{
                name: `${Math.random().toString(36).substring(7)}.png`,
                file: this.dataURItoBlob(this.canvas.toDataURL('png'))
            }]}
        )
    };

    drawGrid = (silent = false) => {
        const cellWidth = this.state.cellWidth;
        for (let x = 1; x < (this.canvas.width / 20); x++) {
            const line1 = new fabric.Line([cellWidth * x, 0, cellWidth * x, this.canvas.height], {
                stroke: "#000000",
                strokeWidth: 1,
                selectable: false
            });
            const line2 = new fabric.Line([0, cellWidth * x, this.canvas.width, cellWidth * x], {
                stroke: "#000000",
                strokeWidth: 1,
                selectable: false
            });
            this.gridObjects.push(line1);
            this.gridObjects.push(line2);
            this.canvas.add(line1);
            this.canvas.add(line2);
        }
        if(!silent){
            this.gridOn = true;
            this.setState({...this.state, gridOnIcon: true});
        }
        this.fill = null;
        this.canvas.renderAll.bind(this.canvas)();
    };

    removeGrid = (silent = false) => {
        this.gridObjects.forEach((obj, key) => {
            if(obj && obj.type === 'line'){
                this.canvas.remove(obj);
            }
        });
        if(!silent){
            this.gridOn = false;
            this.setState({...this.state, gridOnIcon: false});
        }
        this.gridObjects = [];
        this.canvas.renderAll.bind(this.canvas)();
    };

    updateGrid = () => {
        this.removeGrid(true);
        this.drawGrid(true);
    };

    addShape = (type) => {
        if(!this.canvas) return;
        const fill = (!this.fill || this.fill === '#ffffff' ? 'rgba(0,0,0,0)' : this.fill);
        const stroke = (fill === 'rgba(0,0,0,0)' ? "black" : 'rgba(0,0,0,0)');
        let shape = null;
        if(type === 'rect'){
            shape = new fabric.Rect({
                left: 100,
                top: 50,
                width: 100,
                height: 100,
                fill: fill,
                stroke: stroke,
                strokeWidth: 2
            });
        }else if(type === 'circle'){
            shape = new fabric.Circle({
                top: 140,
                left: 230,
                radius: 75,
                fill: fill,
                stroke: stroke,
                strokeWidth: 2,
            })
        }else if(type === 'triangle'){
            shape = new fabric.Triangle({
                top: 300,
                left: 210,
                width: 100,
                height: 100,
                fill: fill,
                stroke: stroke,
                strokeWidth: 2,
            })
        }

        shape ? this.canvas.add(shape) : null;
        this.canvas.renderAll.bind(this.canvas)();
    };

    setFullImage = data => {
        const img = new Image();
        img.onload = () => {
            const fImg = new fabric.Image(img);
            fImg.set({width: this.canvas.width, height: this.canvas.height, originX: 'left', originY: 'top'});
            this.canvas.setBackgroundImage(fImg, this.canvas.renderAll.bind(this.canvas));
        };
        img.src = `data:image/jpeg;base64,${data.image}`;
    };

    componentDidMount(){

        this.canvas = new fabric.Canvas('paper', {
            isDrawingMode: false,
            selection: true,
            height: this.paper.parentNode.offsetHeight - (this.paper.parentNode.offsetHeight / 9),
            width: this.paper.parentNode.offsetWidth
        });

        fabric.Object.prototype.transparentCorners = false;
        this.canvas.freeDrawingBrush.width = 10;

        socket.on('full-image', data => {
            if(!this.canvas) return;
            this.setFullImage(data)
        });


        socket.emit("get-full-image", {id: 0});
        window.onresize = this.resizeCanvas;
        window.addEventListener("keyup", (event) => {
            if(event.keyCode === 46 || event.keyCode === 8){
                if(this.canvas.getActiveObject()){
                    this.canvas.getActiveObject().remove();
                }else if(this.canvas.getActiveGroup()){
                    this.canvas.getActiveGroup().forEachObject(obj => { this.canvas.remove(obj)});
                    this.canvas.discardActiveGroup().renderAll.bind(this.canvas)();
                }

            }
        });

        this.canvas.on('after:render', () => {
            this.canvas.contextContainer.strokeStyle = '#555';
            this.canvas.forEachObject(obj => {
                const setCoords = obj.setCoords.bind(obj);
                obj.on({
                    moving: setCoords,
                    scaling: setCoords,
                    rotating: setCoords
                });
            });

        });
    }

    handleSliderChange = (event, value) => {
        this.setState({...this.state, cellWidth: value})
    };

    handleColorClick = (event) => {
        this.setState({...this.state, showColor: !this.state.showColor});
    };

    sendFullImage = () => {
        socket.emit("full-canvas", {canvas: this.canvas.toJSON()});
    };
    componentDidUpdate(){
        if(this.gridOn){
            this.updateGrid()
        }

        if(this.canvas && this.canvas.freeDrawingBrush){
            this.canvas.freeDrawingBrush.width = parseInt(this.state.penSize);
        }
        if(isNaN(this.state.penSize)){
            this.setState({...this.state, penSize: 10});
        }
    }

    render(){
        const style = {
            height: window.innerHeight * 0.98,
            width: (window.innerHeight * 0.98) * (16/9),
            backgroundColor: "white",
            overflow: "hidden"
        };
        const shapeButtonStyle = {
            padding: 0,
            margin: 0,
            display: "table-cell",
            minWidth: 40,
            width: 50
        };

        const separatorStyle = {
            height: "100%",
            width: 3
        };
        const spanStyle = {
            letterSpacing: 0,
            textTransform: "uppercase",
            fontWeight: 500,
            fontSize: 14,
            fontFamily: "Roboto, sans-serif",
            color:"rgb(0, 188, 212)"
        };
        return (
            <div style={style}>
                <Toolbar>
                    <ToolbarGroup>
                        <RaisedButton
                            style={{
                                minWidth: 80,
                            }}
                            icon={<Panorama />}
                            onClick={this.props.openDrawer}
                        />
                        <RaisedButton
                            icon={this.state.gridOnIcon ? <GridOff/> : <GridOn/>}
                            style={{
                                minWidth: 80,
                            }}
                            onClick={()=>{this.state.gridOnIcon ? this.removeGrid() : this.drawGrid()}}
                        />
                        <Slider
                            value={this.state.cellWidth}
                            min={20}
                            max={120}
                            style={{width: 200, paddingLeft: "5%", paddingTop:"3%"}}
                            step={2}
                            onChange={this.handleSliderChange}
                        />
                    </ToolbarGroup>
                    <ToolbarGroup>
                        <RaisedButton
                            style={{
                                minWidth: 80,
                            }}
                            icon={<Publish/>}
                            onClick={this.sendFullImage}
                        />
                        <RaisedButton
                            style={{
                                minWidth: 80,
                            }}
                            icon={<Save/>}
                            onClick={this.saveCanvas}
                        />
                    </ToolbarGroup>
                    <ToolbarSeparator style={separatorStyle} />
                    <ToolbarGroup>
                        <FlatButton
                            style={{
                                marginRight: 0,
                                minWidth: 40,
                            }}
                            icon={<Clear/>}
                            label="Clear objects"
                            onClick={()=>{
                                const bg = this.canvas.backgroundImage;
                                this.canvas.clear();
                                this.canvas.setBackgroundImage(bg, this.canvas.renderAll.bind(this.canvas));
                            }}
                        />
                    </ToolbarGroup>
                </Toolbar>
                <canvas
                    id="paper"
                    ref={ref => this.paper = ref}
                />
                <Toolbar>
                    <ToolbarGroup>
                        <FlatButton
                            style={shapeButtonStyle}
                            icon={<CropDin />}
                            onClick={()=>{this.addShape('rect')}}
                        />

                        <FlatButton
                            style={shapeButtonStyle}
                            icon={<PanoramaFishEye />}
                            onClick={()=>{this.addShape('circle')}}
                        />

                        <FlatButton
                            style={shapeButtonStyle}
                            icon={<ChangeHistory />}
                            onClick={()=>{this.addShape('triangle')}}
                        />

                        <ToolbarSeparator style={separatorStyle} />
                        <span
                            style={{
                                marginLeft: 30,
                                marginRight: 10,
                                ...spanStyle
                            }}
                        >Live Draw
                        </span>
                        <CheckBox
                            disabled={!this.canvas ? true : !this.canvas.isDrawingMode}
                            style={{float:"right", width:"5%"}}
                        />

                        <span
                            style={{
                                marginLeft: 30,
                                marginRight: 10,
                                ...spanStyle
                            }}
                        >
                            Pen size
                        </span>
                        <input
                            type="text"
                            pattern="\d*"
                            value={this.state.penSize}
                            disabled={this.canvas ? !this.canvas.isDrawingMode : true}
                            style={{
                                width: 30
                            }}
                            readOnly={this.canvas ? !this.canvas.isDrawingMode : true}
                            onFocus={(event)=>{
                                event.preventDefault();
                                this.setState({
                                    sizeSliderOpen: true,
                                    sizeSliderAnchor: event.currentTarget,
                                });
                            }}
                            onChange={(event)=>{
                                this.setState({...this.state, penSize: event.target.value});
                            }}
                        />
                        <Popover
                            style={{
                                width: 52,
                                height: 200
                            }}
                            open={this.state.sizeSliderOpen}
                            anchorEl={this.state.sizeSliderAnchor}
                            anchorOrigin={{horizontal: 'left', vertical: 'bottom'}}
                            targetOrigin={{horizontal: 'left', vertical: 'top'}}
                            onRequestClose={()=>{
                                this.setState({...this.state, sizeSliderOpen: false})
                            }}
                        >
                            <div
                                style={{
                                    height: 200
                                }}
                            >
                                <Slider
                                    axis="y"
                                    defaultValue={10}
                                    style={{
                                        height: 120,
                                        display: "table",
                                        margin: "0 auto"
                                    }}
                                    value={this.state.penSize}
                                    min={1}
                                    max={200}
                                    step={1}
                                    onChange={(event, value)=>{
                                        this.setState({...this.state, penSize: value})
                                    }}
                                />
                            </div>
                        </Popover>

                        <FlatButton
                            label={this.state.drawingMode ? "Selection" : "FreeDraw"}
                            icon={this.state.drawingMode ? <OpenWith/> : <Edit/>}
                            onClick={()=>{
                                this.canvas.isDrawingMode = !this.canvas.isDrawingMode;
                                this.canvas.selection = !this.canvas.selection;
                                this.setState({...this.state, drawingMode: this.canvas.isDrawingMode})
                            }}
                        />

                        {this.state.showColor ? (
                            <div style={{
                                left: "100%",
                                bottom: "30%",
                                zIndex: 9999,
                                position:"absolute"}}>
                                <CompactPicker onChange={(color, event)=>{
                                    this.fill = color.hex;
                                    this.canvas.freeDrawingBrush.color = color.hex;
                                }} />
                            </div>
                        ): ""}
                        <FlatButton
                            icon={<Palette/>}
                            onClick={this.handleColorClick}
                        />
                    </ToolbarGroup>
                </Toolbar>
            </div>
        )
    }
}