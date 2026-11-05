var ButtonState = {
    UP: "UP",
    DOWN: "DOWN"
};

function Button(img, x, y, w, h) {
    this.img = img;
    this.w = w;
    this.h = h;
    this.x = x;
    this.y = y;
    this.state = ButtonState.UP;
}

Button.prototype.handleEvents = function(pointer) {
    // Check if pointer is inside the button bounds
    var isInside = inrect(pointer.x,pointer.y,this.x,this.y,this.w,this.h);

    if (pointer.isDown && isInside) {
        this.state = ButtonState.DOWN;
    } else {
        this.state = ButtonState.UP;
    }
};

Button.prototype.draw = function() {

	switch(this.state) {
		case ButtonState.UP:
		    ctx.fillStyle = palette[10];
		break;
		case ButtonState.DOWN:
		    ctx.fillStyle = palette[11];
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
