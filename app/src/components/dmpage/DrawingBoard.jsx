import React, {Component} from 'react';
import {Toolbar, ToolbarGroup, ToolbarSeparator} from 'material-ui/Toolbar';
import RaisedButton from 'material-ui/RaisedButton';
import FlatButton from "material-ui/FlatButton";
import Slider from "material-ui/Slider";
import socket from '../../socket'
import {CompactPicker} from "react-color";

export default class DrawingBoard extends Component {
    constructor(props) {
        super(props);
        this.state = {
            cellWidth : 50,
            fillColor: null,
            showColor: false
        }
    }

    resizeCanvas = () =>{
        this.canvas.setHeight(window.innerHeight);
        this.canvas.setWidth(window.innerWidth);
        this.canvas.renderAll();
    };

    gridObjects = [];
    gridOn = false;

    drawGrid = () => {
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
        this.gridOn = true;
        this.fill = null;
        this.canvas.renderAll.bind(this.canvas)();
    };

    removeGrid = () => {
        this.gridObjects.forEach((obj, key) => {
            if(obj && obj.type === 'line'){
                this.canvas.remove(obj);
            }
        });
        this.gridObjects = [];
        this.gridOn = false;
        this.canvas.renderAll.bind(this.canvas)();
    };

    addShape = (type) => {
        if(!this.canvas) return;
        console.log(this.fill);
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

    setFullImage = (data) => {
        const img = new Image();
        img.src = `data:image/jpeg;base64,${data.image}`;
        img.onload = () => {
            const fImg = new fabric.Image(img);
            fImg.set({width: this.canvas.width, height: this.canvas.height, originX: 'left', originY: 'top'});
            this.canvas.setBackgroundImage(fImg, this.canvas.renderAll.bind(this.canvas));
        }

    };

    componentDidUpdate(){
        if(this.gridOn){
            this.removeGrid();
            this.drawGrid();
        }
    }

    componentDidMount(){

        this.canvas = new fabric.Canvas('paper', {
            isDrawingMode: false,
            selection: true,
            height: this.paper.parentNode.offsetHeight - Math.round(this.paper.parentNode.offsetHeight/14),
            width: this.paper.parentNode.offsetWidth
        });

        fabric.Object.prototype.transparentCorners = false;
        this.canvas.freeDrawingBrush.width = 10;

        socket.on('full-image', data => {
            if(!this.canvas) return;
            if(data.cached){
                this.setFullImage(sessionStorage.getItem(data.name));
                return;
            }
            this.setFullImage(data)
        });

        if(sessionStorage.getItem("default")){
            this.setFullImage(sessionStorage.getItem("default"))
        }else{
            socket.emit("get-full-image", {name: "default"});
        }

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

    render(){
        const style = {
            height: window.innerHeight,
            width: "69%",
            backgroundColor: "white",
            overflow: "scroll"
        };
        const shapeButtonStyle = {
            width: 10,
            padding: 0,
            margin: 0,
            display: "table-cell"
        };

        const separatorStyle = {
            height: "100%",
            width: 3
        };
        return (
            <div style={style}>
                <Toolbar>
                    <ToolbarGroup>
                        <RaisedButton
                            label="Toggle grid"
                            style={{width:140}}
                            onClick={()=>{this.gridOn ? this.removeGrid() : this.drawGrid()}}
                        />
                        <Slider
                            defaultValue={25}
                            value={this.state.cellWidth}
                            min={20}
                            max={120}
                            style={{width: 200, paddingLeft: "5%", paddingTop:"3%"}}
                            step={1}
                            onChange={this.handleSliderChange}
                        />
                    </ToolbarGroup>
                    <ToolbarGroup>
                        <RaisedButton
                            label="Show"
                            onClick={this.sendFullImage}
                        />
                    </ToolbarGroup>
                    <ToolbarSeparator style={separatorStyle} />
                    <ToolbarGroup>
                        <FlatButton
                            style={shapeButtonStyle}
                            label="&#9632;"
                            onClick={()=>{this.addShape('rect')}}
                        />
                        <FlatButton
                            style={shapeButtonStyle}
                            label="&#9679;"
                            onClick={()=>{this.addShape('circle')}}
                        />
                        <FlatButton
                            style={shapeButtonStyle}
                            label="&#9650;"
                            onClick={()=>{this.addShape('triangle')}}
                        />
                        <ToolbarSeparator style={separatorStyle} />
                        <FlatButton
                            label={this.state.drawingMode ? "Selection" : "FreeDraw"}
                            onClick={()=>{
                                this.canvas.isDrawingMode = !this.canvas.isDrawingMode;
                                this.canvas.selection = !this.canvas.selection;
                                this.setState({...this.state, drawingMode: this.canvas.isDrawingMode})
                            }}
                        />
                        <input
                            type="number"
                            defaultValue={10}
                            disabled={this.canvas ? !this.canvas.isDrawingMode : true}
                            style={{
                                width: 50
                            }}
                            readOnly={this.canvas ? !this.canvas.isDrawingMode : true}
                            onChange={(event)=>{
                                this.canvas.freeDrawingBrush.width = parseInt(event.target.value);
                            }}
                        />
                    </ToolbarGroup>
                    <ToolbarSeparator style={separatorStyle} />
                    <ToolbarGroup>
                        {this.state.showColor ? (
                            <div style={{
                                left: -300,
                                top: 50,
                                zIndex: 9999,
                                position:"absolute"}}>
                                <CompactPicker onChange={(color, event)=>{
                                    this.fill = color.hex;
                                    this.canvas.freeDrawingBrush.color = color.hex;
                                }} />
                            </div>
                        ): ""}
                        <FlatButton
                            label="Color"
                            onClick={this.handleColorClick}
                        />
                    </ToolbarGroup>
                </Toolbar>
                <canvas
                    id="paper"
                    ref={ref => this.paper = ref}
                />
            </div>
        )
    }
}