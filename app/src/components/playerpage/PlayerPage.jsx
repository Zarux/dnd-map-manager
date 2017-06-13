import React, {Component} from 'react';
import RaisedButton from 'material-ui/RaisedButton'
import socket from '../../socket'


export default class PlayerPage extends Component {


    constructor(props) {
        super(props);
        socket.emit("join-room",{
            room: this.props.match.params.room
        })
    }
    old_canvas_width = null;
    old_canvas_height = null;
    canvas = null;
    resizeCanvas = () =>{
        if (!window.screenTop && !window.screenY) {
            this.canvas.setHeight(1);
            this.canvas.setWidth(1);
            this.canvas.renderAll();
        } else {
            this.canvas.setHeight(window.innerHeight);
            this.canvas.setWidth(window.innerWidth);
            this.canvas.renderAll();
        }
    };

    fullCanvas = () =>{
        if(!this.canvas) return;
        const canvas = this.canvas.getSelectionElement().parentNode;
        if(canvas.requestFullScreen) {
            canvas.requestFullScreen();
        }
        else if(canvas.webkitRequestFullScreen) {
            canvas.webkitRequestFullScreen();
        }
        else if(canvas.mozRequestFullScreen) {
            canvas.mozRequestFullScreen();
        }
    };

    fixIt = () => {
        const bi = this.canvas.backgroundImage;
        let xFactor = window.innerWidth / this.old_canvas_width;
        let yFactor = window.innerHeight / this.old_canvas_height;
        if(bi) {
            xFactor = window.innerWidth / bi.width;
            yFactor = window.innerHeight / bi.height;
            this.canvas.setHeight(window.innerHeight);
            this.canvas.setWidth(window.innerWidth);
            bi.width = window.innerWidth;
            bi.height = window.innerHeight;
        }

        this.canvas.forEachObject(obj => {
            obj.lockMovementX = true;
            obj.lockMovementY = true;
            obj.lockScalingX = true;
            obj.lockScalingY = true;

            const scaleX = obj.scaleX;
            const scaleY = obj.scaleY;
            const left = obj.left;
            const top = obj.top;

            const tempScaleX = scaleX * xFactor;
            const tempScaleY = scaleY * yFactor;
            const tempLeft = left * xFactor;
            const tempTop = top * yFactor;

            obj.scaleX = tempScaleX;
            obj.scaleY = tempScaleY;
            obj.left = tempLeft;
            obj.top = tempTop;
            obj.setCoords();
        });
        this.canvas.renderAll.bind(this.canvas)();
        this.canvas.calcOffset();
    };

    componentDidMount(){
        this.canvas = new fabric.Canvas('paper', {
            isDrawingMode: false,
            selection: false,
            height: 1,
            width: 1,
        });
        this.canvas.on('after:render', () => {
            this.canvas.isDrawingMode = false;
            this.canvas.selection = false;
        });
        document.addEventListener('fullscreenchange', this.resizeCanvas, false);
        document.addEventListener('webkitfullscreenchange', this.resizeCanvas, false);
        document.addEventListener('mozfullscreenchange', this.resizeCanvas, false);
        socket.on("full-canvas", data => {
            if(data.canvas && window.screenTop && window.screenY){
                this.canvas.loadFromJSON(data.canvas, ()=>{
                    this.old_canvas_height = this.canvas.height;
                    this.old_canvas_width = this.canvas.width;
                    this.canvas.selection = false;
                    this.canvas.isDrawingMode = false;
                    this.fixIt();
                });
            }
        });
    }

    render(){

        return (
            <div
                style={{
                    display: "table",
                    margin: "0 auto",
                    marginTop: "10%"
                }}
            >
                <RaisedButton
                    style={{
                        height: window.innerHeight/2,
                        width: window.innerWidth/2
                    }}
                    primary={true}
                    label="Start"
                    labelStyle={{
                        fontSize: 84
                    }}
                    onClick={this.fullCanvas}
                />
                <canvas
                id="paper"
                ref={ref => this.paper = ref}
                />
            </div>
        )
    }
}