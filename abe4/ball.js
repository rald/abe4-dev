Ball=function(font,letter, x, y, d) {
	this.BallState = {
	    UP: "UP",
		OVER: "OVER",
	    DOWN: "DOWN"
	};

	this.font=font;

    this.letter = letter.toUpperCase();
    this.x = x;
    this.y = y;
    this.d = d;
    this.targetX = x;
    this.targetY = y;
    this.state = this.BallState.UP;
	this.isPressed=false;
	this.isClicked=false;
    this.isUsed=false;
    this.containerIndex=-1;
}

Ball.prototype.moveTo = function(x,y) {
    this.targetX=x;
    this.targetY=y;
};

Ball.prototype.update = function() {
    // Smoothly interpolate current position toward target position
    this.x += (this.targetX - this.x) * 0.2;
    this.y += (this.targetY - this.y) * 0.2;
};

Ball.prototype.handleEvents = function(pointer) {
    var isInside = incirc(pointer.x, pointer.y, this.x, this.y, this.d/2);
    this.isClicked = false;

    if (pointer.isDown) {
        if (isInside && !this.isPressed && this.state !== this.BallState.DOWN) {
            this.isPressed = true;
        }
        if (this.isPressed && isInside) {
            this.state = this.BallState.DOWN;
        } else {
            this.state = isInside ? this.BallState.OVER : this.BallState.UP;
        }
    } else {
        if (this.isPressed && isInside) {
            this.isClicked = true;
        }
        this.isPressed = false;
        this.state = isInside ? this.BallState.OVER : this.BallState.UP;
    }
};

Ball.prototype.draw = function(ctx) {
	var backgroundColor = palette[10];

	switch(this.state) {
		case this.BallState.UP:
		    backgroundColor = palette[10];
		break;
		case this.BallState.OVER:
		    backgroundColor = palette[9];
		break;
		case this.BallState.DOWN:
		    backgroundColor = palette[10];
		break;
	}

	Graphics.fillCircle(ctx,this.x,this.y,this.d/2,backgroundColor);
	Graphics.drawCircle(ctx,this.x,this.y,this.d/2,palette[12]);
	this.font.fillText(ctx,this.letter,this.x,this.y,palette[12]);
}
