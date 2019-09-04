class Vector {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.y = z;
    }
    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }
    length2D() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
}

module.exports = {
    Vector,
};
