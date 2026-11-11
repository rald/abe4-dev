Ball=function(letter, x, y, d) {
    this.letter = letter.toUpperCase();
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
    this.d = d;
}

Ball.prototype.update = function() {
    // Smoothly interpolate current position toward target position
    this.x += (this.targetX - this.x) * 0.2;
    this.y += (this.targetY - this.y) * 0.2;
};

Ball.prototype.draw = function(ctx) {
    this.update();

	ctx.beginPath();
	ctx.fillStyle = palette[10];
	ctx.arc(this.x, this.y, this.d/2, 0, 2 * Math.PI);
	ctx.fill();
	ctx.closePath();

	ctx.beginPath();
	ctx.strokeStyle = palette[12];
	ctx.arc(this.x, this.y, this.d/2, 0, 2 * Math.PI);
	ctx.stroke();
	ctx.closePath();

	ctx.fillStyle = palette[12];
	ctx.font = Math.trunc(this.d/2)+"px sans";
	ctx.textAlign = "center";
	ctx.textBaseline="middle";
	ctx.fillText(this.letter, this.x, this.y);
}
