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
    // ETag
    fs.readFile(cssPath, function (error, content) {
        var md5 = require('md5');
        var etag = md5(content);
        // 然后请求头if-none-match过来的时候，来对比
        if (req.headers['if-none-match'] === etag) {
            res.writeHead(304, 'Not Modified');
            res.end();
        } else {
            //第一次设置响应头 ETag
            res.setHeader('ETag', etag);
            res.writeHead(200, 'OK');
            res.end(content);
        }
    });
});
app.get('/*.js', function (req, res, next) {
    const jsPath = path.join(__dirname, '..' + req.originalUrl);
    console.log(jsPath);
    fs.readFile(jsPath, function (error, content) {
        var md5 = require('md5');
        var etag = md5(content);
        if (req.headers['if-none-match'] === etag) {
            res.writeHead(304, 'Not Modified');
            res.end();
        } else {
            res.setHeader('ETag', etag);
            res.writeHead(200, 'OK');
            res.end(content);
        }
    });
});
const server = app.listen(4300, function () {
    const port = server.address().port;
    console.log("应用实例，访问地址为 http://localhost:%s", port)
});
