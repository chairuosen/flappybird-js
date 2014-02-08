$(function(){
	var $start = $('#start').show();
	var $gameover = $('#gameover').hide();
	var st = {
		treeSpeed:4,
		mainTimeLineInterval:30,
		creatTreeInterval:60,
		treeWidth:100
	}
	birdFall = false;
	passby = 0;
	best = window.localStorage.best || 0;
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
			$this.addClass('center');
		}else{
			$this.hasClass('center')&&updateCounter();
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
				y < 0      //太高了
				||
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
		var r = parseInt(Math.random()*80);
		var percent = -(r+10)+"%";
		$('<div>').addClass('tree').css({
			'top':percent,
			'width':st.treeWidth+'px'
		}).appendTo('#background');	 
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
	});
});