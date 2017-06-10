"use strict";

const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io').listen(server);
const config = require("./config");
const fs = require('fs');
const Thumbnail = require('thumbnail');


io.sockets.on('connection', function (socket) {

    socket.on("join-room", data => {
        socket.join(data.room);
        socket.mainRoom = data.room;
        const fileDir = `${__dirname}/images/full/${socket.mainRoom}`;
        const thumbDir = `${__dirname}/images/thumbs/${socket.mainRoom}`;
        if (!fs.existsSync(fileDir)){
            fs.mkdirSync(fileDir);
        }
        if (!fs.existsSync(thumbDir)){
            fs.mkdirSync(thumbDir);
        }
    });

    socket.on("save-images", data => {
        if(!data.files) return;
        Array.from(data.files).forEach((file) => {
            const fileDir = `${__dirname}/images/full/${socket.mainRoom}`;
            const thumbDir = `${__dirname}/images/thumbs/${socket.mainRoom}`;
            const fileName = `${fileDir}/${file.name}`;
            if (!fs.existsSync(fileDir)){
                fs.mkdirSync(fileDir);
            }
            if (!fs.existsSync(thumbDir)){
                fs.mkdirSync(thumbDir);
            }
            const thumbnail = new Thumbnail(fileDir, thumbDir);
            fs.open(fileName, 'a', 0o755, (err, fd) => {
                if (err) throw err;
                fs.write(fd, file.file, null, 'Binary', (err, written, buff) => {
                    fs.close(fd, () => {
                        thumbnail.ensureThumbnail(file.name, 100, null, (err, filename) => {
                            socket.emit("file-saved");
                        });
                    });
                })
            });
        });
    });

    socket.on("get-thumbnails", data => {
        const thumbDir = `${__dirname}/images/thumbs/${socket.mainRoom}`;
        const files = [
            {name:"white-100.png", image: fs.readFileSync(`${__dirname}/images/white.png`).toString('base64')}
        ];
        fs.readdir(thumbDir, (err, filenames) => {
            if (err) throw err;
            filenames.sort((a, b) => {
                return fs.statSync(`${thumbDir}/${a}`).mtime.getTime() + fs.statSync(`${thumbDir}/${b}`).mtime.getTime();
            });
            for(let i = 0; i < filenames.length; i++){
                const content = fs.readFileSync(`${thumbDir}/${filenames[i]}`);
                files.push({name: filenames[i], image: content.toString('base64')})
            }
            socket.emit("thumbnails", {
                images: files
            });
        });
    });

    socket.on("get-full-image", data => {
        let fileName = data.name.replace(/(.*)-100\.(.*)/,"$1.$2");
        const fileDir = `${__dirname}/images/full/${socket.mainRoom}`;
        const thumbDir = `${__dirname}/images/thumbs/${socket.mainRoom}`;
        if(fileName === "white.png"){
           fileName = "../../white.png"
        }
        fs.readFile(`${fileDir}/${fileName}`, (err, data) => {
            if (err) throw err;
            socket.emit("full-image", {
                image: data.toString('base64')
            })
        })
    });

    socket.on("full-canvas", data => {
        socket.broadcast.to(socket.mainRoom).broadcast.emit("full-canvas", data)
    })

});

server.listen(config.serverPort, ()=>{
    console.log("Server running on", config.serverPort)
});

