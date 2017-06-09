import React, {Component} from 'react';
import ImageUpload from './ImageUpload'
import ImagePicker from './ImagePicker'

export default class ImageArea extends Component {
    constructor(props) {
        super(props);
    }

    render(){
        const style = {
            height: window.innerHeight,
            width: "30%",
            backgroundColor: "white",
            border: "1px solid black"
        };
        return (
            <div style={style}>
                <ImageUpload />
                <ImagePicker />
            </div>
        )
    }
}