import { fileManager } from './fileManager.js';
import { FrameGenerator } from './frameGenerator.js';
import { CameraScanner } from './camera.js';
import { Decoder } from './decoder.js';
import { utils } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
    // PWA Registration
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/service-worker.js').catch(err => console.log(err));
    }

    // UI Elements
    const tabSend = document.getElementById('tab-send');
    const tabReceive = document.getElementById('tab-receive');
    const viewSend = document.getElementById('view-send');
    const viewReceive = document.getElementById('view-receive');
    
    // Sender UI
    const fileInput = document.getElementById('file-input');
    const dropZone = document.getElementById('drop-zone');
    const senderControls = document.getElementById('sender-controls');
    const fpsSlider = document.getElementById('fps-slider');
    const fpsVal = document.getElementById('fps-val');
    const btnPlayPause = document.getElementById('btn-play-pause');
    const btnFullscreen = document.getElementById('btn-fullscreen');
    const sendFill = document.getElementById('send-fill');
    
    // Receiver UI
    const recvCount = document.getElementById('recv-count');
    const recvTotal = document.getElementById('recv-total');
    const recvFill = document.getElementById('recv-fill');
    const recvStatus = document.getElementById('recv-status');
    const cameraSelect = document.getElementById('camera-select');

    // Instances
    const frameGen = new FrameGenerator('qr-canvas');
    const camera = new CameraScanner('camera-stream', 'scan-canvas');
    const decoder = new Decoder();

    // --- Tab Switching Logic ---
    tabSend.onclick = () => {
        tabSend.classList.add('active'); tabReceive.classList.remove('active');
        viewSend.classList.add('active'); viewReceive.classList.remove('active');
        camera.stop();
    };

    tabReceive.onclick = async () => {
        tabReceive.classList.add('active'); tabSend.classList.remove('active');
        viewReceive.classList.add('active'); viewSend.classList.remove('active');
        frameGen.pause();
        
        // Populate cameras
        const devices = await camera.getCameras();
        cameraSelect.innerHTML = devices.map(d => `<option value="${d.deviceId}">${d.label || 'Camera'}</option>`).join('');
        await camera.start(devices[0]?.deviceId);
    };

    cameraSelect.onchange = (e) => {
        camera.stop();
        camera.start(e.target.value);
    };

    // --- Sender Logic ---
    const handleFile = async (file) => {
        if(!file) return;
        dropZone.classList.add('hidden');
        senderControls.classList.remove('hidden');
        document.getElementById('send-filename').textContent = `${file.name} (${utils.formatBytes(file.size)})`;
        
        // Generate Frames
        const frames = await fileManager.processFileForSending(file);
        frameGen.setFrames(frames);
        
        // Update Progress UI
        frameGen.onProgress = (current, total) => {
            const pct = Math.round(((current + 1) / total) * 100);
            document.getElementById('send-progress').textContent = `${pct}%`;
            sendFill.style.width = `${pct}%`;
        };

        frameGen.start();
        btnPlayPause.textContent = "Pause";
    };

    // Drag & Drop Listeners
    dropZone.ondragover = (e) => { e.preventDefault(); dropZone.classList.add('dragover'); };
    dropZone.ondragleave = () => dropZone.classList.remove('dragover');
    dropZone.ondrop = (e) => { e.preventDefault(); dropZone.classList.remove('dragover'); handleFile(e.dataTransfer.files[0]); };
    fileInput.onchange = (e) => handleFile(e.target.files[0]);

    // Playback Controls
    fpsSlider.oninput = (e) => { fpsVal.textContent = e.target.value; frameGen.setFps(e.target.value); };
    
    btnPlayPause.onclick = () => {
        if (frameGen.isPlaying) { frameGen.pause(); btnPlayPause.textContent = "Resume"; } 
        else { frameGen.start(); btnPlayPause.textContent = "Pause"; }
    };

    btnFullscreen.onclick = () => {
        const canvas = document.getElementById('qr-canvas');
        if (canvas.requestFullscreen) canvas.requestFullscreen();
    };

    // --- Receiver Logic ---
    camera.onFrameDecoded = (data) => {
        decoder.processFrame(data);
    };

    decoder.onProgress = (received, total) => {
        recvCount.textContent = received;
        recvTotal.textContent = total;
        const pct = Math.round((received / total) * 100);
        recvFill.style.width = `${pct}%`;
        recvStatus.textContent = "Receiving data...";
        recvStatus.style.color = "#a777e3";
    };

    decoder.onComplete = () => {
        recvStatus.textContent = "Transfer Complete! File downloaded.";
        recvStatus.style.color = "#00ff88";
        recvFill.style.background = "#00ff88";
        setTimeout(() => decoder.reset(), 5000); // Reset for next file
    };
});
