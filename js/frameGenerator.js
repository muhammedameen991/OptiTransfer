// frameGenerator.js
// Simple Animation Frame Generator

class FrameGenerator {
    constructor(options = {}) {
        this.canvas = options.canvas;
        this.ctx = this.canvas.getContext("2d");

        this.width = this.canvas.width;
        this.height = this.canvas.height;

        this.frame = 0;
        this.running = false;

        this.fps = options.fps || 60;
        this.interval = 1000 / this.fps;

        this.lastTime = 0;

        this.update = options.update || function () {};
        this.render = options.render || function () {};
    }


    start() {
        if (this.running) return;

        this.running = true;
        requestAnimationFrame(this.loop.bind(this));
    }


    stop() {
        this.running = false;
    }


    loop(time) {
        if (!this.running) return;

        if (time - this.lastTime >= this.interval) {

            this.frame++;

            this.update({
                frame: this.frame,
                time: time
            });

            this.clear();

            this.render({
                ctx: this.ctx,
                frame: this.frame
            });

            this.lastTime = time;
        }

        requestAnimationFrame(this.loop.bind(this));
    }


    clear() {
        this.ctx.clearRect(
            0,
            0,
            this.width,
            this.height
        );
    }


    generateFrames(count, callback) {

        for (let i = 0; i < count; i++) {

            this.frame = i;

            this.clear();

            this.render({
                ctx: this.ctx,
                frame: i
            });

            let image = this.canvas.toDataURL(
                "image/png"
            );

            callback(image, i);
        }
    }
}


export default FrameGenerator;
