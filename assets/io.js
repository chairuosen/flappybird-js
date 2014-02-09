$(function(){
	var socket = io.connect('106.187.94.91:8899');
	socket.on('giveMeInfo',function(){
		var data = {};
		data.best = localStorage.best || 0;
		socket.emit('heresMyInfo',data);
	});
	socket.on('updateAll',function(data){
		var data = sortUser(data);
		$('#user-list').html(toListHtml(data));
	})
	var sortUser = function(obj){
		var s = [];
		for ( var i in obj ){
			s.push([[i],obj[i].best])
		}
		s.sort(function(a,b){
			return parseInt(b[1]) - parseInt(a[1]);
		});
		return s;
	}
	var toListHtml = function(data){
		var html = '';
		for ( var i in data ){
			var score = data[i][1];
			var ip = data[i][0][0];
			html += '<li><span class="score">'+score+'</span><span class="ip">'+ip+'</span></li>';
		}
		return html;
	}
})