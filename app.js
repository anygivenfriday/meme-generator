// === CLIP LIBRARY ===
const CLIPS = [
    { id: 'dark_grain', name: 'Dark Grain', video: '/clips/dark_grain.mp4', thumbnail: '/clips/thumbs/dark_grain.jpg' },
    { id: 'fractal_zoom', name: 'Fractal Zoom', video: '/clips/fractal_zoom.mp4', thumbnail: '/clips/thumbs/fractal_zoom.jpg' },
    { id: 'gradient_wave', name: 'Gradient Wave', video: '/clips/gradient_wave.mp4', thumbnail: '/clips/thumbs/gradient_wave.jpg' },
    { id: 'life_sim', name: 'Life Sim', video: '/clips/life_sim.mp4', thumbnail: '/clips/thumbs/life_sim.jpg' },
    { id: 'matrix_rain', name: 'Matrix Rain', video: '/clips/matrix_rain.mp4', thumbnail: '/clips/thumbs/matrix_rain.jpg' },
    { id: 'neon_pulse', name: 'Neon Pulse', video: '/clips/neon_pulse.mp4', thumbnail: '/clips/thumbs/neon_pulse.jpg' },
    { id: 'retro_grid', name: 'Retro Grid', video: '/clips/retro_grid.mp4', thumbnail: '/clips/thumbs/retro_grid.jpg' },
];

// === CANVAS FILTERS ===
const CANVAS_FILTERS = {
    none: '',
    vintage: 'sepia(0.3) saturate(0.6) brightness(1.06)',
    high_contrast: 'contrast(1.5) brightness(1.05)',
    bw: 'grayscale(1)',
    warm: 'sepia(0.15) brightness(1.05)',
    cool: 'hue-rotate(30deg) brightness(1.05)',
    neon: 'saturate(2.0) contrast(1.2)',
    dreamy: 'blur(1px) brightness(1.08) contrast(1.1)',
};

// === STATE ===
const state = {
    audioFile: null,
    audioUrl: null,
    audioDuration: 0,
    clipVideoUrl: null,
    clipType: null,
    customVideoFile: null,
    captions: [],
    captionIdCounter: 0,
    exportPreset: 'tiktok',
    exportWidth: 1080,
    exportHeight: 1920,
    filter: 'none',
};

// === DOM REFS ===
const audioInput = document.getElementById('audio-input');
const audioDrop = document.getElementById('audio-drop');
const audioPreview = document.getElementById('audio-preview');
const audioName = document.getElementById('audio-name');
const audioDuration = document.getElementById('audio-duration');
const audioPlayer = document.getElementById('audio-player');
const audioRemove = document.getElementById('audio-remove');

const videoInput = document.getElementById('video-input');
const videoDrop = document.getElementById('video-drop');
const clipGrid = document.getElementById('clip-grid');
const customClipPreview = document.getElementById('custom-clip-preview');
const customClipVideo = document.getElementById('custom-clip-video');
const customClipName = document.getElementById('custom-clip-name');
const customClipRemove = document.getElementById('custom-clip-remove');

const captionList = document.getElementById('caption-list');
const addCaptionBtn = document.getElementById('add-caption');
const timelineContainer = document.getElementById('timeline-container');
const timelineTrack = document.getElementById('timeline-track');
const timelineEnd = document.getElementById('timeline-end');

const presetGrid = document.getElementById('preset-grid');
const filterGrid = document.getElementById('filter-grid');

const generateBtn = document.getElementById('generate-btn');
const progressContainer = document.getElementById('progress-container');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');

const resultSection = document.getElementById('step-result');
const resultVideo = document.getElementById('result-video');
const downloadBtn = document.getElementById('download-btn');
const newMemeBtn = document.getElementById('new-meme-btn');

const checkAudio = document.getElementById('check-audio');
const checkVideo = document.getElementById('check-video');

const sourceVideo = document.getElementById('source-video');
const renderCanvas = document.getElementById('render-canvas');

// === TABS ===
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const target = tab.dataset.tab;
        document.getElementById('tab-library').style.display = target === 'library' ? '' : 'none';
        document.getElementById('tab-upload').style.display = target === 'upload' ? '' : 'none';
    });
});

// === DRAG & DROP ===
function setupDragDrop(zone, input) {
    zone.addEventListener('click', (e) => {
        if (e.target.tagName !== 'LABEL') input.click();
    });
    zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.classList.add('drag-over');
    });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('drag-over');
        if (e.dataTransfer.files.length) {
            input.files = e.dataTransfer.files;
            input.dispatchEvent(new Event('change'));
        }
    });
}

setupDragDrop(audioDrop, audioInput);
setupDragDrop(videoDrop, videoInput);

// === AUDIO ===
audioInput.addEventListener('change', () => {
    const file = audioInput.files[0];
    if (!file) return;

    if (state.audioUrl) URL.revokeObjectURL(state.audioUrl);
    state.audioFile = file;
    state.audioUrl = URL.createObjectURL(file);

    // Get duration
    const tempAudio = new Audio();
    tempAudio.src = state.audioUrl;
    tempAudio.addEventListener('loadedmetadata', () => {
        state.audioDuration = tempAudio.duration;
        showAudioPreview();
    });
    tempAudio.addEventListener('error', () => {
        alert('Could not load audio file.');
        state.audioFile = null;
        state.audioUrl = null;
    });
});

function showAudioPreview() {
    audioDrop.style.display = 'none';
    audioPreview.style.display = '';
    audioName.textContent = state.audioFile.name;
    audioDuration.textContent = formatTime(state.audioDuration);
    audioPlayer.src = state.audioUrl;
    updateChecklist();
    updateTimeline();
}

function resetAudioDrop() {
    audioDrop.style.display = '';
    audioDrop.innerHTML = `
        <div class="upload-icon">&#9835;</div>
        <p>Drag & drop audio or <label for="audio-input" class="browse-link">browse</label></p>
        <p class="hint">MP3, WAV, M4A, OGG, AAC</p>
    `;
    audioPreview.style.display = 'none';
    audioInput.value = '';
}

audioRemove.addEventListener('click', () => {
    if (state.audioUrl) URL.revokeObjectURL(state.audioUrl);
    state.audioFile = null;
    state.audioUrl = null;
    state.audioDuration = 0;
    resetAudioDrop();
    updateChecklist();
    updateTimeline();
});

// === VIDEO CLIPS ===
function loadClips() {
    clipGrid.innerHTML = '';
    CLIPS.forEach(clip => {
        const card = document.createElement('div');
        card.className = 'clip-card';
        card.dataset.id = clip.id;
        card.innerHTML = `
            <img src="${clip.thumbnail}" alt="${clip.name}" loading="lazy">
            <video src="${clip.video}" muted loop preload="none"></video>
            <div class="clip-name">${clip.name}</div>
            <div class="selected-badge">&#10003;</div>
        `;
        card.addEventListener('mouseenter', () => {
            const v = card.querySelector('video');
            v.play().catch(() => {});
        });
        card.addEventListener('mouseleave', () => {
            const v = card.querySelector('video');
            v.pause();
            v.currentTime = 0;
        });
        card.addEventListener('click', () => selectPreloadedClip(clip, card));
        clipGrid.appendChild(card);
    });
}

function selectPreloadedClip(clip, card) {
    document.querySelectorAll('.clip-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    state.clipVideoUrl = clip.video;
    state.clipType = 'preloaded';
    if (state.customVideoFile) {
        URL.revokeObjectURL(state.customVideoFile);
        state.customVideoFile = null;
    }
    customClipPreview.style.display = 'none';
    updateChecklist();
}

videoInput.addEventListener('change', () => {
    const file = videoInput.files[0];
    if (!file) return;

    if (state.customVideoFile) URL.revokeObjectURL(state.customVideoFile);
    const url = URL.createObjectURL(file);
    state.clipVideoUrl = url;
    state.clipType = 'custom';
    state.customVideoFile = url;

    document.querySelectorAll('.clip-card').forEach(c => c.classList.remove('selected'));
    videoDrop.style.display = 'none';
    customClipPreview.style.display = '';
    customClipVideo.src = url;
    customClipVideo.play().catch(() => {});
    customClipName.textContent = file.name;
    updateChecklist();
});

function resetVideoDrop() {
    videoDrop.style.display = '';
    videoDrop.innerHTML = `
        <div class="upload-icon">&#9654;</div>
        <p>Drag & drop video or <label for="video-input" class="browse-link">browse</label></p>
        <p class="hint">MP4, MOV, WEBM</p>
    `;
    customClipPreview.style.display = 'none';
    videoInput.value = '';
}

customClipRemove.addEventListener('click', () => {
    if (state.customVideoFile) URL.revokeObjectURL(state.customVideoFile);
    state.clipVideoUrl = null;
    state.clipType = null;
    state.customVideoFile = null;
    resetVideoDrop();
    updateChecklist();
});

// === CAPTIONS ===
addCaptionBtn.addEventListener('click', () => {
    const id = ++state.captionIdCounter;
    const defaultStart = state.captions.length > 0
        ? Math.max(...state.captions.map(c => c.end))
        : 0;
    const defaultEnd = Math.min(defaultStart + 3, state.audioDuration || 999);

    state.captions.push({
        id,
        text: '',
        start: parseFloat(defaultStart.toFixed(1)),
        end: parseFloat(defaultEnd.toFixed(1)),
        position: 'bottom',
        size: 'medium',
    });
    renderCaptions();
    updateTimeline();
});

function renderCaptions() {
    captionList.innerHTML = '';
    state.captions.forEach(cap => {
        const el = document.createElement('div');
        el.className = 'caption-item';
        el.innerHTML = `
            <div class="caption-fields">
                <textarea class="caption-text-input" rows="2" placeholder="Enter caption text..."
                    data-id="${cap.id}" data-field="text">${cap.text}</textarea>
                <div class="caption-row">
                    <label>Start (s)</label>
                    <input type="number" min="0" step="0.1" value="${cap.start}"
                        data-id="${cap.id}" data-field="start">
                    <label>End (s)</label>
                    <input type="number" min="0" step="0.1" value="${cap.end}"
                        data-id="${cap.id}" data-field="end">
                    <select data-id="${cap.id}" data-field="position">
                        <option value="top" ${cap.position === 'top' ? 'selected' : ''}>Top</option>
                        <option value="center" ${cap.position === 'center' ? 'selected' : ''}>Center</option>
                        <option value="bottom" ${cap.position === 'bottom' ? 'selected' : ''}>Bottom</option>
                    </select>
                    <select data-id="${cap.id}" data-field="size">
                        <option value="small" ${cap.size === 'small' ? 'selected' : ''}>Small</option>
                        <option value="medium" ${cap.size === 'medium' ? 'selected' : ''}>Medium</option>
                        <option value="large" ${cap.size === 'large' ? 'selected' : ''}>Large</option>
                    </select>
                </div>
            </div>
            <button class="btn-icon caption-remove" data-id="${cap.id}" title="Remove">&times;</button>
        `;
        captionList.appendChild(el);
    });

    captionList.querySelectorAll('[data-field]').forEach(input => {
        const event = input.tagName === 'TEXTAREA' ? 'input' : 'change';
        input.addEventListener(event, (e) => {
            const id = parseInt(e.target.dataset.id);
            const field = e.target.dataset.field;
            const cap = state.captions.find(c => c.id === id);
            if (!cap) return;
            if (field === 'start' || field === 'end') {
                cap[field] = parseFloat(e.target.value) || 0;
            } else {
                cap[field] = e.target.value;
            }
            updateTimeline();
        });
    });

    captionList.querySelectorAll('.caption-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            state.captions = state.captions.filter(c => c.id !== id);
            renderCaptions();
            updateTimeline();
        });
    });
}

function updateTimeline() {
    const duration = state.audioDuration || 0;
    if (state.captions.length === 0 || duration <= 0) {
        timelineContainer.style.display = 'none';
        return;
    }
    timelineContainer.style.display = '';
    timelineEnd.textContent = formatTime(duration);
    timelineTrack.innerHTML = '';

    state.captions.forEach(cap => {
        const left = (cap.start / duration) * 100;
        const width = ((cap.end - cap.start) / duration) * 100;
        const block = document.createElement('div');
        block.className = 'timeline-block';
        block.style.left = Math.max(0, left) + '%';
        block.style.width = Math.max(1, Math.min(width, 100 - left)) + '%';
        block.textContent = cap.text.substring(0, 20) || '...';
        timelineTrack.appendChild(block);
    });
}

// === PRESETS ===
presetGrid.querySelectorAll('.preset-card').forEach(card => {
    card.addEventListener('click', () => {
        presetGrid.querySelectorAll('.preset-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        state.exportPreset = card.dataset.preset;
        state.exportWidth = parseInt(card.dataset.w);
        state.exportHeight = parseInt(card.dataset.h);
    });
});

// === FILTERS ===
filterGrid.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        filterGrid.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.filter = btn.dataset.filter;
    });
});

// === CHECKLIST ===
function updateChecklist() {
    const audioOk = !!state.audioFile;
    const videoOk = !!state.clipVideoUrl;

    checkAudio.className = 'check-item' + (audioOk ? ' done' : '');
    checkAudio.querySelector('.check-icon').innerHTML = audioOk ? '&#10003;' : '&#9675;';
    checkVideo.className = 'check-item' + (videoOk ? ' done' : '');
    checkVideo.querySelector('.check-icon').innerHTML = videoOk ? '&#10003;' : '&#9675;';

    generateBtn.disabled = !(audioOk && videoOk);
}

// === GENERATE ===
generateBtn.addEventListener('click', () => {
    if (!state.audioFile || !state.clipVideoUrl) return;
    startGeneration();
});

async function startGeneration() {
    generateBtn.disabled = true;
    generateBtn.innerHTML = '<span class="spinner"></span> Preparing...';
    progressContainer.style.display = '';
    progressBar.style.width = '5%';
    progressText.textContent = 'Loading media...';
    resultSection.style.display = 'none';

    try {
        // Load the video source
        await loadSourceVideo(state.clipVideoUrl);
        progressBar.style.width = '15%';
        progressText.textContent = 'Setting up recording...';

        // Decode audio
        const audioCtx = new AudioContext();
        const audioBuffer = await state.audioFile.arrayBuffer();
        const decodedAudio = await audioCtx.decodeAudioData(audioBuffer);
        const duration = decodedAudio.duration;

        // Set canvas dimensions
        const outW = state.exportWidth;
        const outH = state.exportHeight;
        renderCanvas.width = outW;
        renderCanvas.height = outH;
        const ctx = renderCanvas.getContext('2d');

        // Create an OfflineAudioContext for the audio stream
        const offlineCtx = new OfflineAudioContext(
            decodedAudio.numberOfChannels,
            decodedAudio.length,
            decodedAudio.sampleRate
        );
        const offlineSource = offlineCtx.createBufferSource();
        offlineSource.buffer = decodedAudio;
        offlineSource.connect(offlineCtx.destination);
        offlineSource.start(0);

        // Start rendering audio offline
        const renderedAudioBuffer = await offlineCtx.startRendering();

        // Create a new audio context to play back the rendered buffer for capture
        const playbackCtx = new AudioContext({ sampleRate: renderedAudioBuffer.sampleRate });
        const playbackSource = playbackCtx.createBufferSource();
        playbackSource.buffer = renderedAudioBuffer;
        const destNode = playbackCtx.createMediaStreamDestination();
        playbackSource.connect(destNode);
        playbackSource.connect(playbackCtx.destination); // also hear it (optional)

        // Canvas stream
        const fps = 30;
        const canvasStream = renderCanvas.captureStream(fps);

        // Combine canvas video + audio
        const combinedStream = new MediaStream([
            ...canvasStream.getVideoTracks(),
            ...destNode.stream.getAudioTracks(),
        ]);

        // Setup MediaRecorder
        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
            ? 'video/webm;codecs=vp9,opus'
            : 'video/webm;codecs=vp8,opus';
        const recorder = new MediaRecorder(combinedStream, {
            mimeType,
            videoBitsPerSecond: 4000000,
        });

        const chunks = [];
        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunks.push(e.data);
        };

        const recordingDone = new Promise((resolve) => {
            recorder.onstop = () => resolve();
        });

        // Start recording
        recorder.start(100);
        playbackSource.start(0);

        // Play source video
        sourceVideo.currentTime = 0;
        sourceVideo.play().catch(() => {});

        progressBar.style.width = '20%';
        progressText.textContent = 'Recording meme... 0%';

        // Render loop
        const startTime = performance.now();
        const durationMs = duration * 1000;
        const filterCss = CANVAS_FILTERS[state.filter] || '';

        const renderFrame = () => {
            const elapsed = performance.now() - startTime;
            const currentTime = elapsed / 1000;

            if (elapsed >= durationMs) {
                // Done
                recorder.stop();
                playbackSource.stop();
                sourceVideo.pause();
                return;
            }

            // Draw video frame to canvas with cover crop
            drawVideoCover(ctx, sourceVideo, outW, outH, filterCss);

            // Draw captions
            drawCaptions(ctx, state.captions, currentTime, outW, outH);

            // Update progress
            const pct = Math.min(95, 20 + Math.round((elapsed / durationMs) * 75));
            progressBar.style.width = pct + '%';
            progressText.textContent = `Recording meme... ${Math.round((elapsed / durationMs) * 100)}%`;

            requestAnimationFrame(renderFrame);
        };

        requestAnimationFrame(renderFrame);

        // Wait for recording to finish
        await recordingDone;

        progressBar.style.width = '100%';
        progressText.textContent = 'Done!';

        // Create blob
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);

        playbackCtx.close();

        setTimeout(() => showResult(url), 300);

    } catch (err) {
        console.error('Generation failed:', err);
        alert('Generation failed: ' + err.message);
        resetGenerateBtn();
    }
}

function loadSourceVideo(url) {
    return new Promise((resolve, reject) => {
        sourceVideo.src = url;
        sourceVideo.load();
        sourceVideo.onloadeddata = () => resolve();
        sourceVideo.onerror = () => reject(new Error('Failed to load video clip'));
    });
}

function drawVideoCover(ctx, video, outW, outH, filterCss) {
    const vw = video.videoWidth || outW;
    const vh = video.videoHeight || outH;

    // Calculate cover crop
    const scale = Math.max(outW / vw, outH / vh);
    const sw = outW / scale;
    const sh = outH / scale;
    const sx = (vw - sw) / 2;
    const sy = (vh - sh) / 2;

    if (filterCss) {
        ctx.filter = filterCss;
    } else {
        ctx.filter = 'none';
    }

    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, outW, outH);
    ctx.filter = 'none';
}

function drawCaptions(ctx, captions, currentTime, outW, outH) {
    captions.forEach(cap => {
        if (currentTime < cap.start || currentTime > cap.end || !cap.text) return;

        // Font size
        let fontSize;
        if (cap.size === 'small') fontSize = Math.round(outW * 0.04);
        else if (cap.size === 'large') fontSize = Math.round(outW * 0.08);
        else fontSize = Math.round(outW * 0.06);

        ctx.font = `bold ${fontSize}px Arial, sans-serif`;
        ctx.textAlign = 'center';

        // Position
        let y;
        if (cap.position === 'top') y = fontSize * 2;
        else if (cap.position === 'center') y = outH / 2;
        else y = outH - fontSize * 2;

        const x = outW / 2;
        const maxWidth = outW * 0.85;

        // Word wrap
        const lines = wrapText(ctx, cap.text, maxWidth);
        const lineHeight = fontSize * 1.3;
        const totalHeight = lines.length * lineHeight;

        // Adjust y for multi-line centering
        let startY = y - totalHeight / 2 + fontSize / 2;

        lines.forEach((line, i) => {
            const ly = startY + i * lineHeight;

            // Outline
            ctx.strokeStyle = 'black';
            ctx.lineWidth = fontSize * 0.15;
            ctx.lineJoin = 'round';
            ctx.strokeText(line, x, ly);

            // Fill
            ctx.fillStyle = 'white';
            ctx.fillText(line, x, ly);
        });
    });
}

function wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let current = '';

    words.forEach(word => {
        const test = current ? current + ' ' + word : word;
        if (ctx.measureText(test).width > maxWidth && current) {
            lines.push(current);
            current = word;
        } else {
            current = test;
        }
    });
    if (current) lines.push(current);
    return lines.length ? lines : [''];
}

function showResult(blobUrl) {
    progressContainer.style.display = 'none';
    resetGenerateBtn();
    resultSection.style.display = '';
    resultVideo.src = blobUrl;
    resultVideo.play().catch(() => {});
    downloadBtn.href = blobUrl;
    resultSection.scrollIntoView({ behavior: 'smooth' });
}

function resetGenerateBtn() {
    generateBtn.disabled = !(state.audioFile && state.clipVideoUrl);
    generateBtn.innerHTML = 'Generate Meme Video';
}

// === RESET ===
newMemeBtn.addEventListener('click', () => {
    if (state.audioUrl) URL.revokeObjectURL(state.audioUrl);
    state.audioFile = null;
    state.audioUrl = null;
    state.audioDuration = 0;
    state.clipVideoUrl = null;
    state.clipType = null;
    state.captions = [];
    state.captionIdCounter = 0;

    resetAudioDrop();
    resetVideoDrop();
    document.querySelectorAll('.clip-card').forEach(c => c.classList.remove('selected'));
    captionList.innerHTML = '';
    timelineContainer.style.display = 'none';
    resultSection.style.display = 'none';
    progressContainer.style.display = 'none';
    updateChecklist();
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// === UTILS ===
function formatTime(seconds) {
    if (!seconds || seconds <= 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

// === INIT ===
loadClips();
updateChecklist();
