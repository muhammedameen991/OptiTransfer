/**
 * Manages the high-speed rendering of QR codes to the canvas.
 */
export class FrameGenerator {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        this.frames = [];
        this.currentIndex = 0;
        this.fps = 30;
        this.isPlaying = false;
        this.animationId = null;
        this.lastDrawTime = 0;
        this.onProgress = null;
    }

    setFrames(frames) {
        this.frames = frames;
        this.currentIndex = 0;
    }

    setFps(fps) {
        this.fps = fps;
    }

    async drawFrame() {
        if (!this.frames.length) return;
        const data = this.frames[this.currentIndex];
        
        // Use standard QR code CDN logic
        await QRCode.toCanvas(this.canvas, data, { 
            width: this.canvas.width || 400, 
            margin: 2, 
            errorCorrectionLevel: 'L' // Low EC for maximum data density
        });

        if (this.onProgress) {
            this.onProgress(this.currentIndex, this.frames.length);
        }

        this.currentIndex = (this.currentIndex + 1) % this.frames.length;
    }

    loop(timestamp) {
        if (!this.isPlaying) return;

        const interval = 1000 / this.fps;
        if (timestamp - this.lastDrawTime >= interval) {
            this.drawFrame();
            this.lastDrawTime = timestamp;
        }
        this.animationId = requestAnimationFrame(this.loop.bind(this));
    }

    start() {
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.lastDrawTime = performance.now();
        this.animationId = requestAnimationFrame(this.loop.bind(this));
    }

    pause() {
        this.isPlaying = false;
        if (this.animationId) cancelAnimationFrame(this.animationId);
    }
}
