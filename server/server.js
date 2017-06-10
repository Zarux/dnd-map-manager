"use strict";

const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io').listen(server);
const config = require("./config");
const fs = require('fs');
const Thumbnail = require('thumbnail');
const redis = require("redis");
const client = redis.createClient({
    host: config.redisHost,
    password: config.redisPassword
});


io.sockets.on('connection', function (socket) {

    socket.on("join-room", data => {
        socket.join(data.room);
        socket.mainRoom = data.room;
        console.log("Client joined", socket.mainRoom);
        const fileDir = `${__dirname}/images/full/${socket.mainRoom}`;
        const thumbDir = `${__dirname}/images/thumbs/${socket.mainRoom}`;
        if (!fs.existsSync(fileDir)){
            fs.mkdirSync(fileDir);
        }
        if (!fs.existsSync(thumbDir)){
            fs.mkdirSync(thumbDir);
        }
        client.get(`images:room:${socket.mainRoom}:default`, (err, reply) => {
            if(!reply){
                const defaultImage = `${__dirname}/images/white.png`;
                const image_object = {
                    filename: "default",
                    thumb: defaultImage,
                    full: defaultImage
                };
                client.set(`images:room:${socket.mainRoom}:default`, defaultImage);
                client.rpush(`images:room:${socket.mainRoom}`, JSON.stringify(image_object));
            }
            socket.emit("joined-room")
        })
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
                        thumbnail.ensureThumbnail(file.name, 200, null, (err, thumbName) => {
                            if(err){
                                console.log(err);
                                fs.unlink(fileName);
                            }
                            const image_object = {
                                filename: file.name,
                                thumb: `${thumbDir}/${thumbName}`,
                                full: fileName
                            };
                            client.set(`images:room:${socket.mainRoom}:${file.name}`, fileName);
                            client.rpush(`images:room:${socket.mainRoom}`, JSON.stringify(image_object), (err, message) => {
                                socket.emit("file-saved");
                            });
                        });
                    });
                })
            });
        });
    });

    socket.on("get-thumbnails", data => {
        console.log("got request for thumbnails");
        client.lrange(`images:room:${socket.mainRoom}`, 0, -1, (err, message) => {
            if (err) return err;
            console.log("Thumbnails found");
            const files = [];
            const fileNames = [];
            const data = message.map(x => {
                return JSON.parse(x);
            });

            for(let i = 0; i < data.length; i++){
                const content = fs.readFileSync(data[i].thumb);
                if(!fileNames.includes(data[i].filename)) {
                    fileNames.push(data[i].filename);
                    files.push({name: data[i].filename, image: content.toString('base64')});
                }
            }
            console.log("Sending ", files.length, "thumbnails to room", socket.mainRoom);
            socket.emit("thumbnails", {
                images: files
            });

        });

    });

    socket.on("get-full-image", data => {
        if(data.cached){
            socket.emit("full-image", {cached: true, name: data.name});
            return
        }

        client.get(`images:room:${socket.mainRoom}:${data.name}`, (err, reply) => {
            if(!reply) return;
            fs.readFile(reply, (err, fileData) => {
                if (err) throw err;
                console.log("Sending full image to room", socket.mainRoom);
                socket.emit("full-image", {
                    image: fileData.toString('base64'),
                    name: data.name
                })
            })
        });

    });

    socket.on("full-canvas", data => {
        socket.broadcast.to(socket.mainRoom).broadcast.emit("full-canvas", data)
    })

});

server.listen(config.serverPort, ()=>{
    console.log("Server running on", config.serverPort)
});

