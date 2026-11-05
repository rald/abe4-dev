// Expose functions globally on window
window.preload = preload;
window.setup = setup;
window.draw = draw;

function PointerHandler(element) {
    this.element = element;

    // Bind methods to preserve 'this' context
    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);

    // Attach listeners
    this.element.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('pointercancel', this.onPointerUp);

    // Prevent default touch behaviors like scrolling/zooming on the element
    this.element.style.touchAction = 'none';
}

PointerHandler.prototype.onPointerDown = function(event) {
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
    var coords = this.getCoordinates(event);
    pointer.x = coords.x;
    pointer.y = coords.y;
    pointer.isDown = false;
};

PointerHandler.prototype.getCoordinates = function(event) {
    var rect = this.element.getBoundingClientRect();

    // Directly scale screen coordinates relative to the rendered bounding box
    var clientX = event.clientX - rect.left;
    var clientY = event.clientY - rect.top;

    var scaleX = this.element.width / rect.width;
    var scaleY = this.element.height / rect.height;

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

function rnd(x) {
    return Math.floor(Math.random() * x);
}

function inrect(x, y, rx, ry, rw, rh) {
    return x >= rx && x < rx + rw && y >= ry && y < ry + rh;
}

function clrscr(clr) {
    ctx.fillStyle = clr;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawCanvas(cvs, x, y, s, f) {
    var hex = "0123456789ABCDEF";
    for (var j = 0; j < cvs.h; j++) {
        for (var i = 0; i < cvs.w; i++) {
            var k = cvs.p[f][j][i];
            var c = hex.indexOf(k);
            if (c != -1) {
                ctx.fillStyle = palette[c];
                ctx.fillRect(x + i * s, y + j * s, s, s);
            }
        }
    }
}

function drawText(fnt, txt, x, y, s) {
    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ 0123456789[].:'/+-";
    var a = x,
        b = y;
    for (var k = 0; k < txt.length; k++) {
        var l = chars.indexOf(txt[k].toUpperCase());
        if (l != -1) {
            drawCanvas(fnt, a, b, s, l);
            a += (fnt.w + 1) * s;
            if (a + (fnt.w + 1) * s >= canvas.width) {
                a = 0;
                b += (fnt.h + 1) * s;
            }
        }
    }
}

// Preloader UI Drawer with Smooth Animation Progress
function drawProgressBar(percent) {
    clrscr("#000000");

    var barWidth = 180;
    var barHeight = 16;
    var x = (canvas.width - barWidth) / 2;
    var y = (canvas.height - barHeight) / 2;

    // Loading Text
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('LOADING: ' + Math.floor(percent * 100) + '%', canvas.width / 2, y - 10);

    // Progress Bar Background Box
    ctx.strokeStyle = '#555555';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, barWidth, barHeight);

    // Progress Bar Fill
    ctx.fillStyle = '#4CAF50';
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
                console.error('Failed to load text file: ' + item.src);
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
        console.error('Failed to load image: ' + item.src);
        onItemLoaded(item.id, null);
    };
    img.src = item.src;
}

// Dedicated preload phase handler
function preload() {
    gameState = GameState.PRELOADING;
    currentProgress = 0;
    targetProgress = 0;
    preloadCompleteTime = null;

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

    // Kick off asset preloading
    window.preload();
}

function draw() {
    if (gameState === GameState.PRELOADING) {
        // Smoothly ease current progress toward target progress
        var diff = targetProgress - currentProgress;
        currentProgress += diff * 0.15;

        // If we are extremely close or all items are loaded and target is reached, snap to 100%
        if (itemsLoaded >= totalItems && (targetProgress - currentProgress < 0.01 || currentProgress > 0.99)) {
            currentProgress = 1.0;
        }

        drawProgressBar(currentProgress);

        // When 100% is reached, hold the screen for a delay (e.g., 500ms)
        if (currentProgress === 1.0) {
            var now = performance.now();
            if (!preloadCompleteTime) {
                preloadCompleteTime = now;
            }

            var delayMs = 500; // Adjust delay duration here (in milliseconds)
            if (now - preloadCompleteTime >= delayMs) {
                // Once preloading is complete and delay has passed, process assets
                if (loadedAssets.randword) {
                    randwords = loadedAssets.randword.trim().split(/\r\n|\n|\r/);
                    if (randwords.length > 0 && randwords[0] !== "") {
                        chosenRandomWord = randwords[rnd(randwords.length)].trim();
                    }
                }

                if (loadedAssets.wordlist) {
                    wordlists = loadedAssets.wordlist.trim().split(/\r\n|\n|\r/);
                }

                // Transition states cleanly
                gameState = GameState.START;
            }
        }

        window.requestAnimationFrame(draw);
        return;
    }

    // Main Game Loop Render
    clrscr(palette[10]);

    var mx = pointer.x.toFixed(2).padStart(7, ' ');
    var my = pointer.y.toFixed(2).padStart(7, ' ');
    var md = pointer.isDown.toString().toUpperCase();

    drawText(font, mx + " " + my + " " + md, 2, 2, 1);

    // Display the selected random word if it was loaded successfully
    if (chosenRandomWord) {
        drawText(font, "WORD: " + chosenRandomWord, 2, 20, 1);
    }

    // Example: draw loaded images if available
    if (loadedAssets.circle)    ctx.drawImage(loadedAssets.circle, 30, 100, 32, 32);
    if (loadedAssets.triangle)    ctx.drawImage(loadedAssets.triangle, 80, 100, 32, 32);
    if (loadedAssets.cross)        ctx.drawImage(loadedAssets.cross, 130, 100, 32, 32);
    if (loadedAssets.square)    ctx.drawImage(loadedAssets.square, 180, 100, 32, 32);

    window.requestAnimationFrame(draw);
}

// Disables right-click context menu on the entire website
window.addEventListener('contextmenu', (event) => {
    event.preventDefault();
});

var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

var gameState;
var cx;
var cy;

var wordlists=null;
var randwords=null;
var chosenRandomWord = "";
var preloadCompleteTime = null;

// Asset management states and variables
var GameState = {
    PRELOADING: "PRELOADING",
    START:      "START",
    PLAY:       "PLAY",
    COMPLETE:   "COMPLETE",
    END:        "END",
};

var assetsToLoad = [
    { id: 'wordlist', type: 'text', src: 'assets/wordlist.txt' },
    { id: 'randword', type: 'text', src: 'assets/randword.txt' },
    { id: 'circle',    type: 'image', src: 'assets/circle.png' },
    { id: 'triangle',    type: 'image', src: 'assets/triangle.png' },
    { id: 'cross',        type: 'image', src: 'assets/cross.png' },
    { id: 'square',    type: 'image', src: 'assets/square.png' }
];

var loadedAssets = {};
var itemsLoaded = 0;
var totalItems = assetsToLoad.length;
var currentProgress = 0;
var targetProgress = 0;

var pointer = {
    x: 0,
    y: 0,
    isDown: false,
};

var handler = new PointerHandler(canvas);

window.setup();
window.requestAnimationFrame(window.draw);
