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
    var data = {};
    data.type = 1;
    var sortRes = sortUser(ipArray);
    var array_tmp = sortRes.obj;
    data.total = sortRes.total;
    data.array = cutArray(array_tmp,30);
    io.sockets.emit('updateAll',data);
  }

  var g = geo.lookup(socket.handshake.address.address); 
  var location = '['+g.country+'/'+g.city+']';
  var addr = location+socket.handshake.address.address+':'+socket.handshake.address.port;
  ipArray[addr] = {};
  ipArray[addr].location = location;
  ipArray[addr].ip = socket.handshake.address.address;
  socket.emit('giveMeInfo');
  socket.on('heresMyInfo',function(data){
  	var a;
    if(typeof data != 'object' ){
  		a = 0;
  	}
  	a = parseInt(data.best) || 0
  	a = !a? 0:a;
  	a = a<0? 0:a; 
  	a = a>999? 0:a;
  	if( (a - ipArray[addr].last) >200 )
  		a= 0;
    ipArray[addr].best = a;
    ipArray[addr].last = ipArray[addr].best;
    updateToAll();
  });

  var toastStr = '公告';
  socket.emit('toast',{type:false,str:toastStr});

  socket.on('disconnect', function() {
    delete ipArray[addr];
    updateToAll();
  });
});
var sortUser = function(obj){
  var s = [];
  for ( var i in obj ){
    s.push([
      i,
      obj[i].best||0,
      obj[i].location,
      obj[i].ip
      ]);
  }
  s.sort(function(a,b){
    return parseInt(b[1]) - parseInt(a[1]);
  });
  return {
    obj:s,
    total:countObj(obj)
  };
}
var cutArray = function(arr,count){
  var newArray = [];
  var c = 0;
  for (var i in arr){
    c++;
    newArray.push(arr[i])
    if ( c == count ){
      break;
    }
  }
  return newArray;
}
var countObj = function(obj){
  var c = 0;
  for ( var i in obj ){
    c++;
  }
  return c;
}