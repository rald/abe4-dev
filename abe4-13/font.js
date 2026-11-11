Font=function(font,w,h) {
	this.font=font;
	this.w=w;
	this.h=h;
}

Font.prototype.drawChar=function(ctx,x,y,c) {
    var sx = (c % 16) * (this.w + 1) + 1;
    var sy = Math.trunc(c / 16) * (this.h + 1) + 1;
    ctx.drawImage(this.font,sx,sy,this.w,this.h,x,y,this.w,this.h);
}

Font.prototype.drawText=function(ctx,x,y,t) {
    var cx = x, cy = y;
    for (var i = 0; i < t.length; i++) {
        this.drawChar(ctx,cx,cy,t.charCodeAt(i));
        cx += this.w;
        if (cx + this.w > canvas.width) {
            cx = x;
            cy += this.h;
        }
    }
}
