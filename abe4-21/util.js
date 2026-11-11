function rnd(x) {
    return Math.floor(Math.random()*x);
}

function inrect(x, y, rx, ry, rw, rh) {
    return x >= rx && x <= rx + rw && y >= ry && y <= ry + rh;
}

function incirc(x, y, cx, cy, cr) {
    var dx = x - cx;
    var dy = y - cy;
    return (dx * dx + dy * dy) <= (cr * cr);
}


