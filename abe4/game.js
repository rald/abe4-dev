Game = function(canvasId) {
	this.canvas = document.getElementById(canvasId);
	this.ctx = canvas.getContext("2d");

	this.GameState = {
	    PRELOAD: "PRELOAD",
		INIT: "INIT",
	    PLAY: "PLAY",
	    END: "END"
	};

	this.assetsToLoad = [
		{ id: 'wordlist', type: 'text', src: 'assets/wordlist.txt' },
		{ id: 'randword', type: 'text', src: 'assets/randword.txt' },
		{ id: 'circle', type: 'image', src: 'assets/circle.png' },
		{ id: 'triangle', type: 'image', src: 'assets/triangle.png' },
		{ id: 'cross', type: 'image', src: 'assets/cross.png' },
		{ id: 'square', type: 'image', src: 'assets/square.png' },
		{ id: 'sono', family: 'sono', type: 'font', src: 'assets/sono/web/Sono-Bold.woff2' },
		{ id: 'pressstart', family: 'pressstart', type: 'font', src: "assets/PressStart2P/PressStart2P.ttf" }
	];

	this.allottedTime=180;

	this.gameState = this.GameState.PRELOAD;
	this.wordlists = null;
	this.randwords = null;
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
	this.lastBallBoxIndexes=[];
	this.subAnagrams=null;
	this.guessed=null;
	this.numWordsLeft=0;
	this.score=0;
	this.currentTime=0;
	this.remainingTime=0;
	this.timeTickInterval=null;
	this.round=1;
	this.qualify=false;
	this.fullWordBonus=100;
	this.gameCompleteBonus=200;
	this.messages=[];
	this.messageTicks=0;
	this.messageDelay=3;
	this.font=null;
	this.suno=null;
	this.pressstart=null;
	this.hud=null;
	this.display=null;
};

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
};

Game.prototype.onItemLoaded=function(id, assetData) {
    this.loadedAssets[id] = assetData;
    this.itemsLoaded++;
    this.targetProgress = this.itemsLoaded / this.totalItems;
};

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
};

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
};

Game.prototype.loadFontAsset = function(item) {
    var self = this; // Save reference to Game instance
    var fontFace = new FontFace(item.family || item.id, 'url(' + item.src + ')');

    fontFace.load().then(function(loadedFace) {
        document.fonts.add(loadedFace);
        self.onItemLoaded(item.id, loadedFace);
    }).catch(function(err) {
        console.warn('Missing or invalid font file (using fallback): ' + item.src, err);
        self.onItemLoaded(item.id, null);
    });
};

Game.prototype.preload = function() {
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
        } else if (item.type === 'font') {
            this.loadFontAsset(item);
        }
    }
};

Game.prototype.setup=function() {
	this.canvas.width = 256;
	this.canvas.height = 256 + 128;
	
	var self = this;
	this.timeTickInterval = setInterval(function() {
		self.timeTick();
	}, 1000);
	
	this.preload();
};

Game.cleanStr=function(str) {
    return str.replace(/[\r\n]+/g, "").trim().toLowerCase();
};

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
};

// Check if subHist can be formed using letters from targetHist
Game.isSubAnagram=function(subHist, targetHist) {
    for (let char in subHist) {
        if ((targetHist[char] || 0) < subHist[char]) {
            return false;
        }
    }
    return true;
};

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
};

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
};

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
};

Game.prototype.addMessage=function(msg) {
	this.messages.push(msg);
};

Game.prototype.enterBalls=function() {
	
	var balls=[];
	for(var i=0;i<this.balls.length;i++) {
		if(this.balls[i].isUsed) {
			balls.push(this.balls[i]);
		}
	}

	balls.sort((a, b) => a.containerIndex - b.containerIndex);

	var guess="";
	for(var i=0;i<balls.length;i++) {
		guess+=balls[i].letter;
	}

	if(guess==="") return;

	var i=this.subAnagrams.indexOf(guess);

	if(i===-1) {

		this.addMessage("\""+guess+"\" not found.\n");		

	} else if(this.guessed[i]) {

		this.addMessage("\""+guess+"\" already guessed.\n");

	} else {

		this.guessed[i]=true;
		
		var points=guess.length*guess.length*10;

		this.addMessage("Plus "+points+" points.\n");

		this.score+=points;

		if(guess.length === this.word.length) {
			this.score+=this.fullWordBonus;

			this.addMessage("Full word bonus "+this.fullWordBonus+"\n");

			if(!this.qualify) {
				this.addMessage("Next round unlocked.\n");
				this.qualify=true;
			}
		}

		this.numWordsLeft--;
		if(this.numWordsLeft === 0) {
			this.score+=this.gameCompleteBonus;
			this.score+=this.remainingTime*10;

			this.addMessage("Remaining Time bonus "+(this.remainingTimeBonus*10)+".\n");
			this.addMessage("Game completed bonus "+this.gameCompleteBonus+".\n");

			this.gameState=this.GameState.END;
		}

		this.lastBallBoxIndexes=[];
		for(var i=0;i<this.balls.length;i++) {
			if(this.balls[i].isUsed) {
				this.lastBallBoxIndexes.push([i,this.balls[i].containerIndex]);
			}
		}		

		this.clearBalls();
	}

};

Game.prototype.clearBalls=function() {
	while(this.currentBoxIndex) {
		this.clearBall();
	}	
};

Game.prototype.lastBalls=function() {
	this.clearBalls();
	for(var i=0;i<this.lastBallBoxIndexes.length;i++) {
		var j=this.lastBallBoxIndexes[i][0];
		var k=this.lastBallBoxIndexes[i][1];
		this.balls[j].moveTo(this.boxes[k].x,this.boxes[k].y);
		this.balls[j].containerIndex=k;
		this.balls[j].isUsed=true;
		this.currentBoxIndex++;
	}	
};

Game.prototype.timeTick=function() {
	if(this.messages.length>0) {
		if(this.messageTicks>=this.messageDelay) {
			this.messageTicks=0;
			this.messages.shift();
		}
		this.messageTicks++;
	} else if(this.messageTicks>0) {
		this.messageTicks=0;
	}

	if (this.gameState === this.GameState.PLAY) {
		this.remainingTime = this.allottedTime - this.currentTime;
		if (this.remainingTime <= 0) {
			this.remainingTime = 0;
			this.clearBalls();
			this.messages.push("Time is up!");
			this.gameState = this.GameState.END;
		}
		this.currentTime++;
	}
};

Game.prototype.displaySubAnagrams=function(show) {
	var dx=4;
	var dy=84;
	var x=dx;
	var y=dy;
	var w=0;
	var gap=8;
	var fw=8;
	var fh=8;
	for(var i=0;i<this.subAnagrams.length;i++) {
		var len=this.subAnagrams[i].length;

		if(show) {
			if(this.guessed[i]) {
				this.display.fillText(this.ctx,this.subAnagrams[i],x,y,palette[12]);
			} else {
				this.display.fillText(this.ctx,this.subAnagrams[i],x,y,palette[2]);
			}
		} else if(this.guessed[i]) {
			this.display.fillText(this.ctx,this.subAnagrams[i],x,y,palette[12]);
		} else {
			this.display.fillText(this.ctx,'*'.repeat(len),x,y,palette[12]);
		}

		if(w<len) {
			w+=len*fw;
		}
		y+=fh+gap;
		if(y+fh>=256-32) {
			x+=w+gap;
			y=dy;
			w=len*fw;
		}
	}
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

					if(this.loadedAssets.wordlist) this.wordlists = this.loadedAssets.wordlist.trim().split(/\r\n|\n|\r/).map(word => word.toUpperCase());

					if(this.loadedAssets.randword) this.randwords = this.loadedAssets.randword.trim().split(/\r\n|\n|\r/).map(word => word.toUpperCase());

					if(this.loadedAssets.sono) this.sono = this.loadedAssets.sono;

					if(this.loadedAssets.pressstart) this.pressstart = this.loadedAssets.pressstart;

	                this.gameState = this.GameState.INIT;
	            }
		    }
			break;

		case this.GameState.INIT:

			this.font = new Font("16px sono","left","top");
			this.hud = new Font("16px sono","left","top");
			this.display = new Font("8px pressstart","left","top");

			this.word = this.randwords[rnd(this.randwords.length)].trim();
			this.shuffledWord = shuffleString(this.word);
			this.subAnagrams = Game.getSubAnagrams(this.word, this.wordlists, 3);			this.numWordsLeft=this.subAnagrams.length;
			
			this.guessed=[];
			for(var i=0;i<this.subAnagrams.length;i++) {
				this.guessed.push(false);
			}
			
			this.diameter = 32+6;
			this.gap = 4;
			this.ballFont=new Font(Math.floor(this.diameter/2)+"px sono","center","middle");

			this.cx = (this.canvas.width-this.word.length*(this.diameter+this.gap))/2+(this.diameter+this.gap)/2;

			this.cy = this.canvas.height-80;

			this.boxes=[];
			for(var i=0;i<this.shuffledWord.length;i++) {
				this.boxes.push(new Box(
					i*(this.diameter+this.gap)+this.cx,
					this.cy-(this.diameter+this.gap),
					this.diameter
				));
			}

			this.pegs=[];
			for(var i=0;i<this.shuffledWord.length;i++) {
				this.pegs.push(new Peg(
					i*(this.diameter+this.gap)+this.cx,
					this.cy,
					this.diameter/2
				));
			}

			this.balls=[];
			for(var i=0;i<this.shuffledWord.length;i++) {
				this.balls.push(new Ball(this.ballFont,
					this.shuffledWord[i],i*(this.diameter+this.gap)+this.cx,
					this.cy,
					this.diameter-8
				));
				this.balls[i].isUsed=false;
				this.balls[i].containerIndex=i;
			}

			this.diameter=32;
			this.gap=16;
			this.cx = (canvas.width-4*(this.diameter+this.gap))/2;
			this.cy = this.canvas.height-this.diameter-this.gap;

			this.buttons=[];

			this.buttons.push(new Button(this.loadedAssets.circle,0*(this.diameter+this.gap)+this.cx,this.cy,this.diameter,this.diameter));

			this.buttons.push(new Button(this.loadedAssets.triangle,1*(this.diameter+this.gap)+this.cx,this.cy,this.diameter,this.diameter));

			this.buttons.push(new Button(this.loadedAssets.cross,2*(this.diameter+this.gap)+this.cx,this.cy,this.diameter,this.diameter));

			this.buttons.push(new Button(this.loadedAssets.square,3*(this.diameter+this.gap)+this.cx,this.cy,this.diameter,this.diameter));

			this.currentTime=0;
			this.remainingTime=0;

			this.gameState=this.GameState.PLAY;

			break;

		case this.GameState.PLAY:

			Graphics.clrscr(this.ctx,palette[10]);

			this.hud.fillText(this.ctx,"SCORE "+this.score.toString().padStart(7," "),4,4,palette[12]);

			var minutes = Math.floor(this.remainingTime / 60).toString().padStart(2, " ");
			var seconds = (this.remainingTime % 60).toString().padStart(2, "0");
			this.hud.fillText(this.ctx, "TIME  " + (minutes + ":" + seconds).padStart(7, " "), 4, 20, palette[12]);

			this.hud.fillText(this.ctx, "ROUND " + this.round.toString().padStart(7, " "), 4, 36, palette[12]);

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

			this.displaySubAnagrams(false);

			if(this.messages.length>0) {
				for(var i=0;i<this.messages.length;i++) {
					this.hud.fillText(this.ctx,this.messages[i], 4, i*16+52, palette[2]);
				}
			}

		    break;

		case this.GameState.END:

			Graphics.clrscr(this.ctx,palette[10]);

			this.hud.fillText(this.ctx,"SCORE "+this.score.toString().padStart(7," "),4,4,palette[12]);

			var minutes = Math.floor(this.remainingTime / 60).toString().padStart(2, " ");
			var seconds = (this.remainingTime % 60).toString().padStart(2, "0");
			this.hud.fillText(this.ctx, "TIME  " + (minutes + ":" + seconds).padStart(7, " "), 4, 20, palette[12]);

			this.hud.fillText(this.ctx, "ROUND " + this.round.toString().padStart(7, " "), 4, 36, palette[12]);

			if(this.messages.length>0) {
				for(var i=0;i<this.messages.length;i++) {
					this.hud.fillText(this.ctx,this.messages[i], 4, i*16+52, palette[12]);
				}
			}

			if(this.messageRemainingSeconds>0) {
				var messages=this.message.split("\n");
				for(var i=0;i<messages.length;i++) {
					this.hud.fillText(this.ctx,this.message, 4, i*16+52, palette[12]);
				}
			}

			this.hud.fillText(this.ctx, "GAME OVER", (this.canvas.width-9*10)/2, this.canvas.height-16*10, palette[12]);

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
			}

			for(var i=0;i<this.buttons.length;i++) {
				this.buttons[i].handleEvents(pointer);
				this.buttons[i].draw(this.ctx);

				if(this.buttons[i].isClicked) {
				}
			}

			this.displaySubAnagrams(true);

			break;

		default: break;
	}

	window.requestAnimationFrame(function(){self.draw()});
};

window.onload=function() {
	var game = new Game("canvas");

	window.addEventListener('contextmenu', (event) => {
	    event.preventDefault();
	});

	game.setup();

	window.requestAnimationFrame(function() {
	    game.draw();
	});
};

