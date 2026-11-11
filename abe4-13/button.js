var ButtonState = {
    UP: "UP",
	OVER: "OVER",
    DOWN: "DOWN"
};

function Button(img, x, y, w, h) {
    this.img = img;
    this.w = w;
    this.h = h;
    this.x = x;
    this.y = y;
    this.state = ButtonState.UP;
    this.isPressed = false;
    this.isClicked = false;
}

Button.prototype.handleEvents = function(pointer) {
    var isInside = inrect(pointer.x, pointer.y, this.x, this.y, this.w, this.h);

    this.isClicked = false;

    if (pointer.isDown) {
        if (isInside && !this.isPressed && this.state !== ButtonState.DOWN) {
            this.isPressed = true;
        }
        if (this.isPressed && isInside) {
            this.state = ButtonState.DOWN;
        } else {
            this.state = isInside ? ButtonState.OVER : ButtonState.UP;
        }
    } else {
        if (this.isPressed && isInside) {
            this.isClicked = true;
        }
        this.isPressed = false;
        this.state = isInside ? ButtonState.OVER : ButtonState.UP;
    }
};

Button.prototype.draw = function() {
	switch(this.state) {
		case ButtonState.UP:
		    ctx.fillStyle = palette[10];
		break;
		case ButtonState.OVER:
		    ctx.fillStyle = palette[9];
		break;
		case ButtonState.DOWN:
		    ctx.fillStyle = palette[10];
		break;
	}

    ctx.fillRect(this.x, this.y, this.w, this.h);

    ctx.strokeStyle = palette[12];
    ctx.strokeRect(this.x, this.y, this.w, this.h);

    if (this.img) {
        var cx = this.x + (this.w - this.img.width) / 2;
        var cy = this.y + (this.h - this.img.height) / 2;
        ctx.drawImage(this.img, cx, cy, this.img.width, this.img.height);
    }
};
