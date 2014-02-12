$(function(){
	var st = {
		treeSpeed:4,               //障碍(我觉得是树。)移动速度单位 px/帧
		mainTimeLineInterval:30,   //主时间轴速度  单位 ms/帧
		creatTreeInterval:60,      //创建障碍的间隔 单位 帧
		treeWidth:100,             //树宽  单位 px
		treeHeightDiffLimit:30     //障碍缺口的高度变化限制 单位 屏幕高度%
	}
	var $start = $('#start').show();
	var $gameover = $('#gameover').hide();
	var lastTreePos;
	var birdFall = false;
	var passby = 0;
	var best = window.localStorage.best || 0;
	var gameOverMark = false;
	window.t = 0;
	var mainTime = false;
	var gameStart = function(){
		$start.hide();
		if(!!mainTime){
			return;
		}
		mainTime = setInterval(function(){
			window.t++;
			mainTimeLine(t);
		},st.mainTimeLineInterval);
	}
	var setWindow = function(){
		_h = $(window).height();
		_w = $(window).width();
	}
	setWindow();
	var mainTimeLine = function(t){
		treeMoving();
		if(t%st.creatTreeInterval == 10){
			creatTree();
		}
	}
	var updateCounter = function(number){
		if(number===0){
			passby = 0;
		}else{
			passby++;
		}
		$('#counter').text(passby);
	}
	var calcPosition = function($this){
		var left = $this.offset().left;
		if( left < -100 ){
			$this.remove();
			return;
		}
		if( $this.offset().left > (_w-st.treeWidth)/2 -60//  右边界 
			&&
			$this.offset().left < (_w+st.treeWidth)/2 -20//  左边界
			){
			!$this.hasClass('center')&&updateCounter();
			$this.addClass('center');
		}else{
			$this.removeClass('center');

		}
		$this.css('left',left - st.treeSpeed);
	}
	var gameOver = function(){
		//alert('Game Over!');
		clearTimeout(mainTime);
		clearTimeout(birdFall);
		gameOverMark = true;
		if (passby > best){
			best = passby;
			window.localStorage.best = best;
			var data = {'best':best};
			socket.emit('heresMyInfo',data);
		}
		$('#thisTime').text(passby);
		$('#theBest').text(best);
		$gameover.show();
	}
	var checkBirdPosition = function(y){
		var $this = $('.tree.center');
		if ( $this.length == 0){
			return true;
		}
		var a = $this.offset().top + $this.height()/2
		if( y > a + 80
			||
			y < a -105 ){
			return false;
		}
		return true;
	}
	var resetBirdSpeed = function(){
		var $this = $('.the-bird');
		var now_y = $this.offset().top;
		if(!!birdFall)
			clearTimeout(birdFall);
		var bird_t = 0;
		birdFall = setInterval(function(){
			bird_t++;
			var q = -10;
			var y = now_y + Math.pow( ( bird_t + q ) ,2) - 100;
			var _css = y+'px';
			if ( 
				// y < 0      //太高了
				// ||
				y > _h  //掉底下
				||
				!checkBirdPosition(y)  // 撞树
				){
				gameOver();
				return;
			}
			$this.css('top',_css);
		},st.mainTimeLineInterval);
	}

	var treeMoving = function(e){
		$('.tree').each(function(){
			calcPosition($(this));
		});
	};
	var creatTree = function(){
		var r = parseInt(Math.random()*80) + 10;
		if(!!lastTreePos){
			if( r > lastTreePos + st.treeHeightDiffLimit )
				r = lastTreePos + st.treeHeightDiffLimit;
			if( r < lastTreePos - st.treeHeightDiffLimit )
				r = lastTreePos - st.treeHeightDiffLimit;
		}
		var percent = r -100+"%";
		var h = _h -100 + 'px';
		var $div = $('<div>');
		$div.addClass('tree').css({
			'top':percent,
			'width':st.treeWidth+'px'
		}).appendTo('#background');
		$div.append('<div class="before" style="height:'+h+'"></div><div class="after" style="height:'+h+'"></div>');
		lastTreePos = r;
	};
	var resetAll = function(){
		$('.tree').remove();
		$('.the-bird').css('top','50%');
		clearTimeout(mainTime);
		clearTimeout(birdFall);
		updateCounter(0);
		window.t = 0;
		gameOverMark = mainTime = false;
		$gameover.hide();
	}
	$(window).off().on('keydown',function(e){
		switch(e.keyCode){
			case 27:
				// clearTimeout(mainTime);
				resetAll();
				break;
			case 32:
				if( !gameOverMark ){
					gameStart();
					resetBirdSpeed();
				}
				break;
		}
	}).on('resize',function(){
		setWindow();
	}).on('touchstart',function(){
		if( !gameOverMark ){
			gameStart();
			resetBirdSpeed();
		}
	}).on('longTap',function(){
		resetAll();
	});

	// SOCKET.IO
	//   - - # 作弊可耻，看什么看，就是你！
	window.socket = io.connect('106.187.94.91:8899');
	socket.on('giveMeInfo',function(){
		var data = {};
		data.best = localStorage.best || 0;
		socket.emit('heresMyInfo',data);
	});
	socket.on('updateAll',function(data){
		window.u = data;
		if ( !!data.type && data.type == 1 ){
			$('#user-list').html(toListHtml(data.array));
			$('#user-list').attr('total',data.total);
		}else{
			var data = sortUser(data);
			$('#user-list').html(toListHtml(data));
		}
	});
	socket.on('toast',function(data){
		if( typeof(data.type) == 'boolean'){
			$.Toast(data.type,data.str);
		}else{
			$.Toast(false);
		}
	})
	socket.on('reconnect_failed', function () {
		$.flashToast('服务器上厕所去啦!',2000);
	})
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
		return s;
	}
	var toListHtml = function(data){
		var html = '';
		var c =0;
		for ( var i in data ){
			c++;
			var score = data[i][1];
			var loc = data[i][2];
			var theip = data[i][3];
			html += '<li><span class="score">'+score+'</span><span class="ip"><span class="city">'+loc+'</span> '+theip+'</span></li>';
			if ( c >29 ){
				break;
			}
		}
		return html;
	}
	countObj = function(obj){
		var c = 0;
		for ( var i in obj ){
			c++;
		}
		return c;
	}
	$.Toast = function(type,str){
		var str = str || '';
		var $div = $('#toast');
		if(type){
			$div.text(str).show();
		}else{
			$div.empty().hide();
		}
	}
	$.flashToast = function(str,t){
		$.Toast(true,str);
		setTimeout(function(){
			$.Toast(false);
		},t);
	}

});
