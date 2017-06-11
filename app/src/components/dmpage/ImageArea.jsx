import React, {Component} from 'react';
import ImageUpload from './ImageUpload'
import ImagePicker from './ImagePicker'
import Drawer from 'material-ui/Drawer';

export default class ImageArea extends Component {
    constructor(props) {
        super(props);
        this.state = {
            open: this.props.drawerOpen
        }
    }

    render(){

        return (
            <Drawer
                docked={false}
                width={"30%"}
                open={this.props.drawerOpen}
                onRequestChange={this.props.closeDrawer}
            >
                    <ImageUpload />
                    <ImagePicker />
            </Drawer>
        )
    }
}