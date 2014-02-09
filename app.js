var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')

app.listen(8899);

function handler (req, res) {
  if(req.url=='/index.html' || req.url=='/') {
    fs.readFile('./index.html',function(err,data){
        res.end(data);
    });
  } else {
      fs.readFile('./'+req.url,function(err,data){
        res.end(data);
        console.log(req.url);

    });
  }
}
var ipArray = {};
io.sockets.on('connection', function (socket) {
  var updateToAll = function(){
    io.sockets.emit('updateAll',ipArray);
  }
  var addr = socket.handshake.address.address; 
  ipArray[addr] = {};
  socket.emit('giveMeInfo');
  socket.on('heresMyInfo',function(data){
    ipArray[addr].best = parseInt(data.best);
    updateToAll();
  });
  socket.on('disconnect', function() {
    delete ipArray[addr];
    updateToAll();
  });
});