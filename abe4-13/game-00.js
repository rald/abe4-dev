function PointerHandler(element) {
    this.element = element;

    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);

    this.element.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('pointercancel', this.onPointerUp);

    this.element.style.touchAction = 'none';
}

PointerHandler.prototype.onPointerDown = function(event) {
    try {
        this.element.setPointerCapture(event.pointerId);
    } catch (err) {}

    var coords = this.getCoordinates(event);
    pointer.x = coords.x;
    pointer.y = coords.y;
    pointer.isDown = true;
};

PointerHandler.prototype.onPointerMove = function(event) {
    var coords = this.getCoordinates(event);
    pointer.x = coords.x;
    pointer.y = coords.y;
};

PointerHandler.prototype.onPointerUp = function(event) {
    try {
        this.element.releasePointerCapture(event.pointerId);
    } catch (err) {}

    var coords = this.getCoordinates(event);
    pointer.x = coords.x;
    pointer.y = coords.y;
    pointer.isDown = false;
};

PointerHandler.prototype.getCoordinates = function(event) {
    var rect = this.element.getBoundingClientRect();

    var canvasWidth = this.element.width;
    var canvasHeight = this.element.height;
    var canvasAspect = canvasWidth / canvasHeight;
    var rectAspect = rect.width / rect.height;

    var renderWidth, renderHeight, offsetX, offsetY;

    if (rectAspect > canvasAspect) {
        renderHeight = rect.height;
        renderWidth = renderHeight * canvasAspect;
        offsetX = rect.left + (rect.width - renderWidth) / 2;
        offsetY = rect.top;
    } else {
        renderWidth = rect.width;
        renderHeight = renderWidth / canvasAspect;
        offsetX = rect.left;
        offsetY = rect.top + (rect.height - renderHeight) / 2;
    }

    var clientX = event.clientX - offsetX;
    var clientY = event.clientY - offsetY;

    var scaleX = canvasWidth / renderWidth;
    var scaleY = canvasHeight / renderHeight;

    return {
        x: clientX * scaleX,
        y: clientY * scaleY,
        clientX: event.clientX,
        clientY: event.clientY
    };
};

PointerHandler.prototype.destroy = function() {
    this.element.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('pointercancel', this.onPointerUp);
};

function clrscr(clr) {
    ctx.fillStyle = clr;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawTextFallback(w, h, x, y, t) {
    ctx.fillStyle = palette[12];
    ctx.font = '16px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(t, x, y);
}

function drawChar(fontImg, w, h, x, y, c) {
    if (!fontImg) {
        drawTextFallback(w, h, x, y, c);
        return;
    }
    var code = c.codePointAt(0);
    var sx = (code % 16) * (w + 1) + 1;
    var sy = Math.trunc(code / 16) * (h + 1) + 1;
    ctx.drawImage(fontImg, sx, sy, w, h, x, y, w, h);
}

function drawText(fontImg, w, h, x, y, t) {
    if (!fontImg) {
        drawTextFallback(w, h, x, y, t);
        return;
    }
    var cx = x, cy = y;
    for (var i = 0; i < t.length; i++) {
        drawChar(fontImg, w, h, cx, cy, t[i]);
        cx += w;
        if (cx + w > canvas.width) {
            cx = x;
            cy += h;
        }
    }
}

function drawProgressBar(percent) {
    clrscr("#000000");

    var barWidth = 180;
    var barHeight = 16;
    var x = (canvas.width - barWidth) / 2;
    var y = (canvas.height - barHeight) / 2;

    ctx.fillStyle = palette[12];
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('LOADING: ' + Math.floor(percent * 100) + '%', canvas.width / 2, y - 10);

    ctx.strokeStyle = palette[1];
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, barWidth, barHeight);

    ctx.fillStyle = palette[5];
    ctx.fillRect(x + 2, y + 2, (barWidth - 4) * percent, barHeight - 4);
}

function onItemLoaded(id, assetData) {
    loadedAssets[id] = assetData;
    itemsLoaded++;
    targetProgress = itemsLoaded / totalItems;
}

function loadTextAsset(item) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', item.src, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200 || (xhr.status === 0 && xhr.responseText)) {
                onItemLoaded(item.id, xhr.responseText);
            } else {
                console.warn('Missing text file (using fallback): ' + item.src);
                onItemLoaded(item.id, null);
            }
        }
    };
    xhr.send();
}

function loadImageAsset(item) {
    var img = new Image();
    img.onload = function() {
        onItemLoaded(item.id, img);
    };
    img.onerror = function() {
        console.warn('Missing image file (using fallback): ' + item.src);
        onItemLoaded(item.id, null);
    };
    img.src = item.src;
}

function preload() {
    gameState = GameState.PRELOADING;
    currentProgress = 0;
    targetProgress = 0;
    preloadCompleteTime = null;

    if (assetsToLoad.length === 0) {
        targetProgress = 1.0;
        itemsLoaded = 0;
        totalItems = 1;
        onItemLoaded('dummy', true);
        return;
    }

    for (var i = 0; i < assetsToLoad.length; i++) {
        var item = assetsToLoad[i];
        if (item.type === 'text') {
            loadTextAsset(item);
        } else if (item.type === 'image') {
            loadImageAsset(item);
        }
    }
}

function setup() {
    canvas.width = 256;
    canvas.height = 256 + 128;

    cx = (canvas.width - 11 * 6) / 2;
    cy = (canvas.height - 5) / 2;

    window.preload();
}

function shuffleBalls() {
    if (!balls || balls.length === 0) return;

    var targets = balls.map(function(b) {
        return { x: b.targetX, y: b.targetY };
    });

    for (var i = targets.length - 1; i > 0; i--) {
        var j = rnd(i + 1);
        var temp = targets[i];
        targets[i] = targets[j];
        targets[j] = temp;
    }

    for (var i = 0; i < balls.length; i++) {
        balls[i].targetX = targets[i].x;
        balls[i].targetY = targets[i].y;
    }
}

function draw() {

	switch(gameState) {

		case GameState.PRELOADING:
	        var diff = targetProgress - currentProgress;
	        currentProgress += diff * 0.15;

	        if (itemsLoaded >= totalItems && (targetProgress - currentProgress < 0.01 || currentProgress > 0.99)) {
	            currentProgress = 1.0;
	        }

	        drawProgressBar(currentProgress);

	        if (currentProgress === 1.0) {
	            var now = performance.now();
	            if (!preloadCompleteTime) {
	                preloadCompleteTime = now;
	            }

	            var delayMs = 300; 
	            if (now - preloadCompleteTime >= delayMs) {
	                if (loadedAssets.randword && typeof loadedAssets.randword === 'string') {
	                    randwords = loadedAssets.randword.trim().split(/\r\n|\n|\r/);
	                    if (randwords.length > 0 && randwords[0] !== "") {
	                        word = randwords[rnd(randwords.length)].trim();
	                    }
	                }

	                if (loadedAssets.wordlist && typeof loadedAssets.wordlist === 'string') {
	                    wordlists = loadedAssets.wordlist.trim().split(/\r\n|\n|\r/);
	                }

	                if (loadedAssets.font) {
	                    font = loadedAssets.font;
	                }

	                gameState = GameState.INIT;
	            }
		    }
			break;

		case GameState.INIT:

			diameter = 36;
			gap = 4;

			cx=(canvas.width-word.length*(diameter+gap))/2+(diameter+gap)/2;
			cy=canvas.height;

			balls = [];
			for (var i = 0; i < word.length; i++) {
				balls.push(new Ball(word[i],i*(diameter+gap)+cx,cy-80,diameter-6));
			}

			pegs = [];
			for (var i = 0; i < word.length; i++) {
				pegs.push(new Peg(i*(diameter+gap)+cx,cy-80,diameter/2-6));
			}

			boxes = [];
			for (var i = 0; i < word.length; i++) {
				boxes.push(new Box(i*(diameter+gap)+cx,cy-120,diameter));
			}

			buttons = [];
			buttons.push(new Button(loadedAssets.circle,30,cy-44,32,32));
			buttons.push(new Button(loadedAssets.triangle,80,cy-44,32,32));
			buttons.push(new Button(loadedAssets.cross,130,cy-44,32,32));
			buttons.push(new Button(loadedAssets.square,180,cy-44,32,32));

			gameState = GameState.PLAY;
			break;

		case GameState.PLAY:

		    clrscr(palette[10]);

		    var mx = pointer.x.toFixed(2).padStart(7, ' ');
		    var my = pointer.y.toFixed(2).padStart(7, ' ');

		    drawText(font, 8, 8, 2, 0, "X:" + mx + " Y:" + my + " DOWN:" + pointer.isDown);
		    drawText(font, 8, 8, 2, 8, "FRAMES:" + frames);

		    if (word) {
		        drawText(font, 8, 8, 2, 16, "WORD:" + word.toUpperCase());
		    }

			for(var box of boxes) {
				box.draw();
			}

			for(var peg of pegs) {
				peg.draw();
			}

			for(var ball of balls) {
				ball.draw();
			}

			for(var i = 0; i < buttons.length; i++) {
				var button = buttons[i];
				button.handleEvents(pointer);
				button.draw();

				if (button.isClicked) {
					if (i === 0) { // Circle button index
						shuffleBalls();
					}
				}
			}

		    frames++;

		    break;

		default:
		    break;
	}

	// Keep the animation loop running continuously across all states
	window.requestAnimationFrame(window.draw);
}

var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

var GameState = {
    PRELOADING: "PRELOADING",
	INIT: "INIT",
    PLAY: "PLAY",
    COMPLETE: "COMPLETE",
    END: "END",
};

var assetsToLoad = [{
        id: 'wordlist',
        type: 'text',
        src: 'assets/wordlist.txt'
    },
    {
        id: 'randword',
        type: 'text',
        src: 'assets/randword.txt'
    },
    {
        id: 'font',
        type: 'image',
        src: 'assets/font.png'
    },
    {
        id: 'circle',
        type: 'image',
        src: 'assets/circle.png'
    },
    {
        id: 'triangle',
        type: 'image',
        src: 'assets/triangle.png'
    },
    {
        id: 'cross',
        type: 'image',
        src: 'assets/cross.png'
    },
    {
        id: 'square',
        type: 'image',
        src: 'assets/square.png'
    }
];

var pointer = {
	x: 0,
	y: 0,
	isDown: false,
}

var gameState;

var wordlists = null;
var randwords = null;
var font = null;
var word = "";
var shuffledWord = "";
var preloadCompleteTime = null;
var frames = 0;
var diameter = 32;
var gap = 8;
var cx;
var cy;
var balls=null;
var pegs=null;
var boxes=null;
var buttons=null;

var loadedAssets = {};
var itemsLoaded = 0;
var totalItems = assetsToLoad.length;
var currentProgress = 0;
var targetProgress = 0;

var handler = new PointerHandler(canvas);

window.addEventListener('contextmenu', (event) => {
    event.preventDefault();
});

window.preload = preload;
window.setup = setup;
window.draw = draw;
window.setup();
window.requestAnimationFrame(window.draw);
