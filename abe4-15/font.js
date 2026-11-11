Font=function(font,textAlign,textBaseline) {
	this.font=font;
	this.textAlign=textAlign;
	this.textBaseline=textBaseline;
}

Font.prototype.fillText=function(ctx,t,x,y,c) {
	ctx.font=this.font;
	ctx.textAlign=this.textAlign;
	ctx.textBaseline=this.textBaseline;
	ctx.fillStyle=c;
	ctx.fillText(t,x,y);
}
