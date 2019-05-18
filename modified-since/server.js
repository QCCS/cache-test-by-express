const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

app.get('/', function (req, res, next) {
    res.sendFile(path.join(__dirname, '../index.html'));
});
app.get('/*.css', function (req, res, next) {
    const cssPath = path.join(__dirname, '..' + req.originalUrl);
    console.log(cssPath);
    // modified since
    fs.stat(cssPath, function (error, stat) {
        var t = new Date(stat.mtime.toString()).getMinutes();
        console.log(t);
        if (req.headers['if-modified-since'] === new Date(stat.mtime.toString()).getMinutes()+"") {
            console.log("304css");
            res.writeHead(304, 'Not Modified');
            res.end();
        } else {
            fs.readFile(cssPath, function (error, content) {
                //设置文件被修改的时间 之后前端请求过来的时候来对比
                var lastModified = new Date(stat.mtime.toString()).getMinutes();
                res.setHeader('Last-Modified', lastModified);
                res.writeHead(200, 'OK');
                res.end(content);
            });
        }
    });
});
app.get('/*.js', function (req, res, next) {
    const jsPath = path.join(__dirname, '..' + req.originalUrl);
    console.log(jsPath);
    // modified since
    fs.stat(jsPath, function (error, stat) {
        var t = new Date(stat.mtime.toString()).getMinutes();
        console.log(t);
        if (req.headers['if-modified-since'] === new Date(stat.mtime.toString()).getMinutes()+"") {
            console.log("304js");
            res.writeHead(304, 'Not Modified');
            res.end();
        } else {
            fs.readFile(jsPath, function (error, content) {
                var lastModified = new Date(stat.mtime.toString()).getMinutes();
                res.setHeader('Last-Modified', lastModified);
                res.writeHead(200, 'OK');
                res.end(content);
            });
        }
    });
});
const server = app.listen(4300, function () {
    const port = server.address().port;
    console.log("应用实例，访问地址为 http://localhost:%s", port)
});
