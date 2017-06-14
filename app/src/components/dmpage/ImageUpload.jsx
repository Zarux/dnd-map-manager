import React, {Component} from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import socket from '../../socket'
import TextField from "material-ui/TextField";
import FileUpload from 'material-ui-icons/FileUpload'

export default class ImageUpload extends Component {
    constructor(props) {
        super(props);
        this.state = {
            chosenImage: null,
            imageError: null,
        }
    }
    files = [];
    validateImages = () =>{
        const URL = window.URL || window.webkitURL;
        Array.from(this.state.chosenImage.files).forEach((file, idx)=>{
            const image = new Image();
            image.src = URL.createObjectURL(file);
            image.onerror = () => {
                this.setState({...this.state, imageError: "Invalid image"})
            };
            image.onload = () => {
                this.files.push({file: file, name:file.name});
            }
        })
    };

    uploadImages = () => {
        if(!this.imageError && this.files.length > 0){
            socket.emit("save-images", {
                files: this.files
            });
            this.fileInput.value = "";
            this.files = [];
            this.setState({...this.state, chosenImage: null});
        }
    };

    render(){
        const style = {

        };
        if(this.state.chosenImage)this.validateImages();
        const uploadStyle = {
            marginRight: 30
        };
        if(!this.state.chosenImage){
            uploadStyle.display = "none";
        }
        return (
            <div style={style}>
                <span style={{marginLeft: 30}}>Upload: </span>
                <RaisedButton
                    style={{
                        marginTop: "20px",
                        marginLeft: 30
                    }}
                    label="Choose image"
                    onClick={
                        ()=>{
                            this.fileInput.click();
                        }
                    }
                />
                <TextField
                    disabled={true}
                    style={{
                        marginLeft: "20px",
                        marginRight: "20px",
                        width: "25%"
                    }}
                    hintText="Choose image"
                    errorText={this.state.imageError ? this.state.imageError : ""}
                    value={
                        this.state.imageError ? "" :
                            this.state.chosenImage ? this.state.chosenImage.value.replace(/.*\\/,"") : ""}
                />
                <RaisedButton
                    icon={<FileUpload />}
                    onClick={this.uploadImages}
                    style={uploadStyle}
                />
                <input
                    type="file"
                    ref={ref => this.fileInput = ref}
                    style={{display: "none"}}
                    accept="image/*"
                    onChange={()=>{
                        this.setState({...this.state, chosenImage: this.fileInput, imageError: ""});
                    }}
                />
            </div>
        )
    }

}