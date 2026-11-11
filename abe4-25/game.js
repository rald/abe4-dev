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
		{ id: 'circle',type: 'image',src: 'assets/circle.png' },
		{ id: 'triangle',type: 'image',src: 'assets/triangle.png' },
		{ id: 'cross',type: 'image',src: 'assets/cross.png' },
		{ id: 'square',type: 'image',src: 'assets/square.png' }
	];

	this.gameState = this.GameState.PRELOAD;
	this.wordlists = null;
	this.randwords = null;
	this.font = new Font("16px sans","left","top");
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
	this.currentBoxIndex=0;
	this.ballFont=null;
	this.lastBallIndexes=null;
	this.subAnagrams=null;
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
    this.preload();
}

Game.cleanStr=function(str) {
    return str.replace(/[\r\n]+/g, "").trim().toLowerCase();
}

// Generate character frequency histogram
Game.getHistogram=function(str) {
    const cleaned = Game.cleanStr(str);
    const hist = {};
    for (let char of cleaned) {
        if (char >= 'a' && char <= 'z') {
            hist[char] = (hist[char] || 0) + 1;
        }
    }
    return hist;
}

// Check if subHist can be formed using letters from targetHist
Game.isSubAnagram=function(subHist, targetHist) {
    for (let char in subHist) {
        if ((targetHist[char] || 0) < subHist[char]) {
            return false;
        }
    }
    return true;
}

// Function to find all sub-anagrams of length >= minLength
Game.getSubAnagrams=function(word, wordlist, minLength = 3) {
    const targetHist = Game.getHistogram(word);
    const matches = wordlist.filter(w => {
        const cleaned = Game.cleanStr(w);
        if (cleaned.length < minLength) return false;
        return Game.isSubAnagram(Game.getHistogram(cleaned), targetHist);
    });

    // Remove duplicates
    const uniqueMatches = [...new Set(matches)];

    // Sort by length descending, with randomized positions for words of the same length
    return uniqueMatches.sort((a, b) => {
        if (b.length !== a.length) {
            return b.length - a.length; // Longer words come first
        }
        return Math.random() - 0.5; // Randomize order if lengths are identical
    });
}

Game.prototype.shuffleBalls=function() {
	var ballIndexes=[];
	for(var i=0;i<this.balls.length;i++) {
		if(!this.balls[i].isUsed) {
			ballIndexes.push(i);
		}
	}

	var pegIndexes=[];
	for(var i=0;i<this.pegs.length;i++) {
		pegIndexes.push(i);
	}

	for(var i=pegIndexes.length-1;i>0;i--) {
		var j=rnd(i+1);
		var tmp=pegIndexes[i];
		pegIndexes[i]=pegIndexes[j];
		pegIndexes[j]=tmp;
	}

	for(var i=0;i<ballIndexes.length;i++) {		
		this.balls[ballIndexes[i]].moveTo(
			this.pegs[pegIndexes[i]].x,
			this.pegs[pegIndexes[i]].y
		);
		this.balls[ballIndexes[i]].containerIndex=pegIndexes[i];		
	}
}

Game.prototype.clearBall=function() {

	var usedPegIndexes=[];
	for(var i=0;i<this.balls.length;i++) {
		if(!this.balls[i].isUsed) {
			usedPegIndexes.push(this.balls[i].containerIndex);
		}
	}
	usedPegIndexes.sort();

	var j=-1;
	for(var i=0;i<this.balls.length;i++) {
		if(this.balls[i].isUsed && this.balls[i].containerIndex===this.currentBoxIndex-1) {
			j=i;
			break;
		}
	}

	if(j!=-1) {
		for(var i=this.pegs.length-1;i>=0;i--) {
			if(usedPegIndexes.indexOf(i)===-1) {
				this.balls[j].moveTo(
					this.pegs[i].x,
					this.pegs[i].y
				);
				this.balls[j].isUsed=false;
				this.balls[j].containerIndex=i;
				this.currentBoxIndex--;
				break;
			}
		}
	}
}

Game.prototype.enterBalls=function() {
		
}

Game.prototype.clearBalls=function() {
	while(this.currentBoxIndex) {
		this.clearBall();
	}	
}

Game.prototype.lastBalls=function() {
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

	                this.subAnagrams = Game.getSubAnagrams(this.word, this.wordlists, 3);

	                console.table(this.subAnagrams);

	                this.gameState = this.GameState.INIT;
	            }
		    }
			break;

		case this.GameState.INIT:

			this.diameter = 32+6;
			this.gap = 4;
			this.ballFont=new Font(Math.floor(this.diameter/2)+"px sans","center","middle");

			this.cx = (this.canvas.width-this.word.length*(this.diameter+this.gap))/2+(this.diameter+this.gap)/2;

			this.cy = this.canvas.height-80;

			this.boxes=[];
			for(var i=0;i<this.word.length;i++) {
				this.boxes.push(new Box(
					i*(this.diameter+this.gap)+this.cx,
					this.cy-(this.diameter+this.gap),
					this.diameter
				));
			}

			this.pegs=[];
			for(var i=0;i<this.word.length;i++) {
				this.pegs.push(new Peg(
					i*(this.diameter+this.gap)+this.cx,
					this.cy,
					this.diameter/2
				));
			}

			this.balls=[];
			for(var i=0;i<this.word.length;i++) {
				this.balls.push(new Ball(this.ballFont,
					this.word[i],i*(this.diameter+this.gap)+this.cx,
					this.cy,
					this.diameter-8
				));
				this.balls[i].isUsed=false;
				this.balls[i].containerIndex=i;
			}

			this.diameter=32;
			this.gap=16;
			this.cx = (canvas.width-4*(this.diameter+this.gap))/2;
			this.cy = this.canvas.height-this.diameter-this.gap/2;

			this.buttons=[];

			this.buttons.push(new Button(this.loadedAssets.circle,0*(this.diameter+this.gap)+this.cx,this.cy,this.diameter,this.diameter));

			this.buttons.push(new Button(this.loadedAssets.triangle,1*(this.diameter+this.gap)+this.cx,this.cy,this.diameter,this.diameter));

			this.buttons.push(new Button(this.loadedAssets.cross,2*(this.diameter+this.gap)+this.cx,this.cy,this.diameter,this.diameter));

			this.buttons.push(new Button(this.loadedAssets.square,3*(this.diameter+this.gap)+this.cx,this.cy,this.diameter,this.diameter));

			this.gameState=this.GameState.PLAY;

			break;

		case this.GameState.PLAY:

			Graphics.clrscr(this.ctx,palette[10]);

			for(var i=0;i<this.boxes.length;i++) {
				this.boxes[i].draw(this.ctx);
			}

			for(var i=0;i<this.pegs.length;i++) {
				this.pegs[i].draw(this.ctx);
			}

			for(var i=0;i<this.balls.length;i++) {
				this.balls[i].handleEvents(pointer);
				this.balls[i].update();
				this.balls[i].draw(this.ctx);

				if(this.balls[i].isClicked && !this.balls[i].isUsed) {
					this.balls[i].moveTo(
						this.boxes[this.currentBoxIndex].x,
						this.boxes[this.currentBoxIndex].y
					);
					this.balls[i].isUsed=true;
					this.balls[i].containerIndex=this.currentBoxIndex;
					this.currentBoxIndex++;
				}
			}

			for(var i=0;i<this.buttons.length;i++) {
				this.buttons[i].handleEvents(pointer);
				this.buttons[i].draw(this.ctx);

				if(this.buttons[i].isClicked) {
					if(i===0) this.shuffleBalls();
					else if(i===1) this.enterBalls();
					else if(i===2) this.clearBalls();
					else if(i===3) this.lastBalls();
				}
			}

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

