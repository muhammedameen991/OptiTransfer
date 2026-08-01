/**
 * Manages WebRTC camera streams and feeds them to the decoding logic.
 */
export class CameraScanner {
    constructor(videoId, canvasId) {
        this.video = document.getElementById(videoId);
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        this.stream = null;
        this.isScanning = false;
        this.onFrameDecoded = null;
    }

    async getCameras() {
        const devices = await navigator.mediaDevices.enumerateDevices();
        return devices.filter(d => d.kind === 'videoinput');
    }

    async start(deviceId = null) {
        const constraints = {
            video: {
                deviceId: deviceId ? { exact: deviceId } : undefined,
                facingMode: 'environment', // Prefer back camera
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        };

        try {
            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.video.srcObject = this.stream;
            this.video.setAttribute("playsinline", true);
            await this.video.play();
            
            this.isScanning = true;
            requestAnimationFrame(this.scanLoop.bind(this));
        } catch (err) {
            console.error("Camera access denied or unavailable", err);
            alert("Camera access is required to receive files.");
        }
    }

    stop() {
        this.isScanning = false;
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
    }

    scanLoop() {
        if (!this.isScanning || this.video.readyState !== this.video.HAVE_ENOUGH_DATA) {
            if(this.isScanning) requestAnimationFrame(this.scanLoop.bind(this));
            return;
        }

        // Match canvas to video dimensions
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
        
        // Draw current video frame to hidden canvas
        this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

        // Attempt QR decode using jsQR library
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert", // Optimize for speed
        });

        if (code && code.data) {
            if (this.onFrameDecoded) this.onFrameDecoded(code.data);
        }

        requestAnimationFrame(this.scanLoop.bind(this));
    }
}
