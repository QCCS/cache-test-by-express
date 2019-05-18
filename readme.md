# 前端缓存
## 先不用任何缓存方案，创建一个几个文件
index.html
index.js
style.css
然后把js与css引入html，中，访问index.html
在chrome浏览器中，会发现：
js  是200，会自动缓存在内存中，再次刷新显示 from memory cache。
css 是304，也是有缓存在客户端。 刷新的时候，客户端发了请求，服务端直接告诉客户端，可以用缓存的css文件。
状态码虽然不一样，但是都是使用客户端缓存的。200  from memory cache 是浏览器默认判断缓存的文件可以直接使用，不用发送请求在服务端请求。
如果强制刷新浏览器，则会全部重新加载。
如果，每次css与js改变,都要重新加载，在css与js文件加上版本号，加上版本号，js与css的缓存方式还有点不一样，至少在chorme浏览器中国表现是不一样的。
css一旦改变都会请求到，因为从状态码看是 304，前端的请求css是到服务端的，服务端发现css改变，就会响应到前端。
但是js加上版本号之后，再次刷新也是  from memory cache，没有到服务端请求，所以就算是服务端发生改变，版本号没变，就不会请求最新的资源。

以上讲的，就是前端通用天然的缓存模式。

## 下面搭建一个node服务来验证其他的缓存模式
以下用express搭建
```
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
  // cache control
  fs.readFile(cssPath, function (error, content) {
    //设置10s之内用前端缓存
    res.setHeader('Cache-Control', 'public, max-age=10');
    res.end(content);
  });
});
app.get('/*.js', function (req, res, next) {
  const jsPath = path.join(__dirname, '..' + req.originalUrl);
  console.log(jsPath);
  // cache-control
  fs.readFile(jsPath, function (error, content) {
    res.setHeader('Cache-Control', 'public, max-age=10');
    res.end(content);
  });
});
const server = app.listen(3389, function () {
  const port = server.address().port;
  console.log("应用实例，访问地址为 http://localhost:%s", port)
});

```
主要是这句
```
res.setHeader('Cache-Control', 'public, max-age=10');
```
前端在请求css或者js的时候，服务端设置了响应头，再次刷新浏览器的时候，10s内，就不会发生请求，
直接在内存中拿，显示  from memory cache，但是强制刷新还是会从后端请求数据。
## Cache-Control 还有其他属性
比如：
### must-revalidate
一旦缓存过期，必须向源服务器进行校验，不得使用过期内容。如果无法连接必须返回504。
没有值

### no-cache
如果值，在没有成功通过源站校验的情况下不得使用缓存。
有值，在进行验证的时候不要发送值指示的头域。
如Cache-Control: no-cache="set-cookie,set-cookie2"，表示不要携带cookie进行验证。
关于带有值的情况介绍较少，这里有一个讨论：no-cache头带值时

### no-store
不要缓存当前请求的响应
没有值

### no-transform
与请求头语义相同

https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Cache-Control
不得对资源进行转换或转变。Content-Encoding, Content-Range, Content-Type等HTTP头不能由代理修改。例如，非透明代理可以对图像格式进行转换，以便节省缓存空间或者减少缓慢链路上的流量。 no-transform指令不允许这样做。
没有值

### public
任何缓存都可以进行缓存，即使响应默认是不可缓存或仅私有缓存可存的情况。

### private
没有值，公有缓存不可存储；即使默认是不可缓存的，私有缓存也可以存储
有值，将无值时的作用，限制到指定头字段上。公有有缓存不可存储指定的头字段，而其他字段可以缓存。

### proxy-revalidate
与must-revalidate相同，但仅对公共缓存生效。
没有值

### max-age
在经过指定时间后将过期
有值

### s-maxage
指定响应在公共缓存中的最大存活时间，它覆盖max-age和expires字段。


#以上就是说强缓存
#下面说协商缓存
上面说到的强缓存就是给资源设置个过期时间，客户端每次请求资源时都会看是否过期；只有在过期才会去询问服务器。所以，强缓存就是为了给客户端自给自足用的。而当某天，客户端请求该资源时发现其过期了，这是就会去请求服务器了，而这时候去请求服务器的这过程就可以设置协商缓存。这时候，协商缓存就是需要客户端和服务器两端进行交互的。

可以理解为 客户端与服务端始终需要交互，进行协商决定是否可以用缓存。强缓存是不会协商的，刚才的js就算是加了版本号，第二次刷新的时候，还是没有请求到服务器，直接用缓存。

第一次响应头设置etag， 之后请求头过来时对比 If-None-Match
```
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


```

另一种协商缓存
Last-Modified 与 if-modified-since
```
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

```
就是第一次设置响应头 Last-Modified，之前请求过来，对比请求头 if-modified-since
如果一样就是后端返回304，前端直接使用缓存。






