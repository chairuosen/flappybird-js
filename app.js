var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')
  , geo = require('geoip-lite');

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
  var g = geo.lookup(socket.handshake.address.address); 
  var addr = '['+g.country+'/'+g.city+']'+socket.handshake.address.address+':'+socket.handshake.address.port;
  ipArray[addr] = {};
  socket.emit('giveMeInfo');
  socket.on('heresMyInfo',function(data){
  	if(typeof data != 'object' )return;
  	var a = parseInt(data.best) || 0
  	a = !a? 0:a;
  	a = a<0? 0:a; 
  	a = a>999? 0:a;
  	if( (a - ipArray[addr].last) >100 )return;
  	if( a == undefined ) a = 0;
    ipArray[addr].best = a;
    ipArray[addr].last = ipArray[addr].best;
    updateToAll();
  });
  socket.on('disconnect', function() {
    delete ipArray[addr];
    updateToAll();
  });
});