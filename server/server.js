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
    password: config.redisPassword,
    retry_strategy: (attempt, total_retry_time, error, times_connected) => {
        return 100
    }
});



client.on("error", (err) => {
    console.log("Error " + err);
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
        client.exists(`images:room:${socket.mainRoom}:0:full`, (err, reply) => {
            if(reply === 0){
                const id = 0;
                const defaultImage = `${__dirname}/images/white.png`;
                const content = fs.readFileSync(`${defaultImage}`);
                const image_object_full = {
                    name: "default",
                    file: content.toString("base64"),
                    id: id
                };
                const image_object_thumb = {
                    name: "default",
                    file: content.toString("base64"),
                    id: id
                };
                client.set(`images:room:${socket.mainRoom}:${id}:full`, JSON.stringify(image_object_full));
                client.set(`images:room:${socket.mainRoom}:${id}:thumb`, JSON.stringify(image_object_thumb));
                client.rpush(`images:room:${socket.mainRoom}`, id);
            }
            socket.emit("joined-room")
        })
    });

    socket.on("save-images", data => {
        if(!data.files) return;
        Array.from(data.files).forEach((file) => {
            if(!socket.mainRoom) return;
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
                            const date = new Date();
                            const id = date.getTime() + Math.floor(Math.random() * (9 - 1 + 1)) + 1;

                            const image_object_full = {
                                name: file.name,
                                file: buff.toString("base64"),
                                id: id
                            };
                            const content = fs.readFileSync(`${thumbDir}/${thumbName}`);
                            const image_object_thumb = {
                                name: file.name,
                                file: content.toString("base64"),
                                id: id
                            };

                            client.set(`images:room:${socket.mainRoom}:${id}:full`, JSON.stringify(image_object_full));
                            client.set(`images:room:${socket.mainRoom}:${id}:thumb`, JSON.stringify(image_object_thumb), (err) => {
                                image_object_thumb.image = image_object_thumb.file;
                                socket.emit("file-saved", image_object_thumb);
                            });
                            client.rpush(`images:room:${socket.mainRoom}`, id, (err, message) => {
                                fs.unlink(fileName);
                                fs.unlink(`${thumbDir}/${thumbName}`);
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
            const promises = message.map(x => {
                const key = `images:room:${socket.mainRoom}:${x}:thumb`;
                return key_to_file_object(key).then(image_object => {x = image_object; return x}).catch(err => {return err})
            });

            Promise.all(promises)
                .then(results => {
                    results.forEach(elem => {
                        files.push({name: elem.name, image: elem.file, id: elem.id});
                    });
                    console.log("Sending ", files.length, "thumbnails to room", socket.mainRoom);
                    socket.emit("thumbnails", {
                        images: files
                    });
                })
                .catch(e => {
                    console.error(e);
                });
        });
    });

    socket.on("get-full-image", data => {
        if(data.cached){
            socket.emit("full-image", {cached: true, id: data.id});
            return
        }

        client.get(`images:room:${socket.mainRoom}:${data.id}:full`, (err, reply) => {
            if(!reply) return;
            const data = JSON.parse(reply);
            socket.emit("full-image", {
                image: data.file,
                name: data.name,
                id: data.id
            });
        });

    });
    socket.on("change-name", data => {
        if(!socket.mainRoom || data.id === 0 || data.id === "0") return;
        client.get(`images:room:${socket.mainRoom}:${data.id}:thumb`, (err, reply) => {
            if (err) return err;
            const imgData = JSON.parse(reply);
            imgData.name = data.name;
            client.set(`images:room:${socket.mainRoom}:${data.id}:thumb`, JSON.stringify(imgData));
        })
    });
    socket.on("delete-image", id => {
        if(!socket.mainRoom || id === 0 || id === "0") return;
        client.lrem(`images:room:${socket.mainRoom}`, 1, id);
        client.del(`images:room:${socket.mainRoom}:${id}:full`);
        client.del(`images:room:${socket.mainRoom}:${id}:thumb`);
        socket.emit("file-saved");
    });

    socket.on("full-canvas", data => {
        socket.broadcast.to(socket.mainRoom).broadcast.emit("full-canvas", data)
    })

});

server.listen(config.serverPort, ()=>{
    console.log("Server running on", config.serverPort)
});

const key_to_file_object = key => {
    return new Promise((resolve, reject) => {
        client.get(key, (err, reply) => {
            if (err) reject(err);
            resolve(JSON.parse(reply))
        })
    })
};