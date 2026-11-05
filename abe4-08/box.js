function Box(x, y, s) {
    this.x = x;
    this.y = y;
    this.s = s;
}

Box.prototype.draw = function() {
	ctx.fillStyle = palette[10];
	ctx.fillRect(this.x-this.s/2,this.y-this.s/2,this.s,this.s);

	ctx.strokeStyle = palette[12];
	ctx.strokeRect(this.x-this.s/2,this.y-this.s/2,this.s,this.s);
}
