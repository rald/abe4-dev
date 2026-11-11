function Game(canvasId) {
	this.canvas = document.getElementById(canvasId);
	this.ctx = canvas.getContext("2d");

	this.GameState = {
	    PRELOAD: "PRELOAD",
		INIT: "INIT",
	    PLAY: "PLAY",
	    COMPLETE: "COMPLETE",
	    END: "END"
	};

	this.assetsToLoad = [
		{ id: 'wordlist',type: 'text',src: 'assets/wordlist.txt' },
		{ id: 'randword',type: 'text',src: 'assets/randword.txt' },
		{ id: 'font',type: 'image',src: 'assets/font.png' },
		{ id: 'circle',type: 'image',src: 'assets/circle.png' },
		{ id: 'triangle',type: 'image',src: 'assets/triangle.png' },
		{ id: 'cross',type: 'image',src: 'assets/cross.png' },
		{ id: 'square',type: 'image',src: 'assets/square.png' }
	];

	this.gameState = this.GameState.PRELOAD;
	this.wordlists = null;
	this.randwords = null;
	this.font = null;
	this.word = "";
	this.shuffledWord = "";
	this.preloadCompleteTime = null;
	this.frames = 0;
	this.diameter = 32;
	this.gap = 8;
	this.cx;
	this.cy;
	this.balls=null;
	this.pegs=null;
	this.boxes=null;
	this.buttons=null;
	this.loadedAssets = {};
	this.itemsLoaded = 0;
	this.totalItems = this.assetsToLoad.length;
	this.currentProgress = 0;
	this.targetProgress = 0;
	this.handler = new PointerHandler(canvas);
}

Game.prototype.drawProgressBar=function(percent) {
    Graphics.clrscr(this.ctx,palette[0]);

    var barWidth = 180;
    var barHeight = 16;
    var x = (canvas.width - barWidth) / 2;
    var y = (canvas.height - barHeight) / 2;

    this.ctx.strokeStyle = palette[1];
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x, y, barWidth, barHeight);

    this.ctx.fillStyle = palette[5];
    this.ctx.fillRect(x + 2, y + 2, (barWidth - 4) * percent, barHeight - 4);
}

Game.prototype.onItemLoaded=function(id, assetData) {
    this.loadedAssets[id] = assetData;
    this.itemsLoaded++;
    this.targetProgress = this.itemsLoaded / this.totalItems;
}

Game.prototype.loadTextAsset=function(item) {
    var self = this; // Save reference to Game instance
    var xhr = new XMLHttpRequest();
    xhr.open('GET', item.src, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200 || (xhr.status === 0 && xhr.responseText)) {
                self.onItemLoaded(item.id, xhr.responseText);
            } else {
                console.warn('Missing text file (using fallback): ' + item.src);
                self.onItemLoaded(item.id, null);
            }
        }
    };
    xhr.send();
}

Game.prototype.loadImageAsset=function(item) {
	    var self = this; // Save reference to Game instance
    var img = new Image();
    img.onload = function() {
        self.onItemLoaded(item.id, img);
    };
    img.onerror = function() {
        console.warn('Missing image file (using fallback): ' + item.src);
        self.onItemLoaded(item.id, null);
    };
    img.src = item.src;
}

Game.prototype.preload=function() {
    this.gameState = this.GameState.PRELOAD;
    this.currentProgress = 0;
    this.targetProgress = 0;
    this.preloadCompleteTime = null;

    if (this.assetsToLoad.length === 0) {
        this.targetProgress = 1.0;
        this.itemsLoaded = 0;
        this.totalItems = 1;
        this.onItemLoaded('dummy', true);
        return;
    }

    for (var i = 0; i < this.assetsToLoad.length; i++) {
        var item = this.assetsToLoad[i];
        if (item.type === 'text') {
            this.loadTextAsset(item);
        } else if (item.type === 'image') {
            this.loadImageAsset(item);
        }
    }
}

Game.prototype.setup=function() {
    this.canvas.width = 256;
    this.canvas.height = 256 + 128;

    this.cx = (this.canvas.width - 11 * 6) / 2;
    this.cy = (this.canvas.height - 5) / 2;

    this.preload();
}

Game.prototype.draw=function() {

	var self=this;

	switch(this.gameState) {

		case this.GameState.PRELOAD:
	        var diff = this.targetProgress - this.currentProgress;
	        this.currentProgress += diff * 0.15;

	        if (this.itemsLoaded >= this.totalItems && (this.targetProgress - this.currentProgress < 0.01 || this.currentProgress > 0.99)) {
	            this.currentProgress = 1.0;
	        }

	        this.drawProgressBar(this.currentProgress);

	        if (this.currentProgress === 1.0) {
	            var now = performance.now();
	            if (!this.preloadCompleteTime) {
	                this.preloadCompleteTime = now;
	            }

	            var delayMs = 300; 
	            if (now - this.preloadCompleteTime >= delayMs) {
	                if (this.loadedAssets.randword && typeof this.loadedAssets.randword === 'string') {
	                    this.randwords = this.loadedAssets.randword.trim().split(/\r\n|\n|\r/);
	                    if (this.randwords.length > 0 && this.randwords[0] !== "") {
	                        this.word = this.randwords[rnd(this.randwords.length)].trim();
	                    }
	                }

	                if (this.loadedAssets.wordlist && typeof this.loadedAssets.wordlist === 'string') {
	                    this.wordlists = this.loadedAssets.wordlist.trim().split(/\r\n|\n|\r/);
	                }

	                if (this.loadedAssets.font) {
	                    this.font = new Font(this.loadedAssets.font,8,8);
	                }

	                this.gameState = this.GameState.INIT;
	            }
		    }
			break;

		case this.GameState.INIT:
			Graphics.clrscr(this.ctx,palette[10]);
			this.font.drawText(this.ctx,0,0,"Hello World");
			break;

		case this.GameState.PLAY:
		    break;

		default:
		    break;
	}

	window.requestAnimationFrame(function(){self.draw()});
}

window.onload=function() {
	var game = new Game("canvas");

	window.addEventListener('contextmenu', (event) => {
	    event.preventDefault();
	});

	game.setup();

	window.requestAnimationFrame(function() {
	    game.draw();
	});
}
