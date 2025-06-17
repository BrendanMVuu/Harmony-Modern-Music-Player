// Audio Element Setup
const audio = new Audio();
const playPauseButton = document.getElementById('play-pause');
const stopButton = document.getElementById('stop');
const fileInput = document.getElementById('file-input');
const songTitle = document.getElementById('song-title');
const timeDisplay = document.getElementById('time-display');
const progressBar = document.getElementById('progress-bar');
const progress = document.getElementById('progress');
const volumeSlider = document.getElementById('volume-slider');
const errorPanel = document.getElementById('error-panel');
const loopButton = document.getElementById('loop');
let isPlaying = false;
let audioFileLoaded = false;
let isLooping = false;

// File Loading & Drag-Drop
function handleFile(file) {
    const fileURL = URL.createObjectURL(file);
    audio.src = fileURL;
    songTitle.textContent = file.name;
    isPlaying = false;
    playPauseButton.textContent = '▶️';
    progress.style.width = '0%';
    timeDisplay.textContent = '0:00 / 0:00';
    audioFileLoaded = true;
    audio.addEventListener('timeupdate', updateTimeDisplay);
    audio.play().then(() => {
        isPlaying = true;
        playPauseButton.textContent = '⏸️';
    }).catch(() => {});
}

fileInput.addEventListener('change', function () {
    const file = this.files[0];
    if (file) handleFile(file);
});

document.body.addEventListener('dragover', (e) => {
    e.preventDefault();
    document.body.classList.add('dragging');
});
document.body.addEventListener('dragleave', () => {
    document.body.classList.remove('dragging');
});
document.body.addEventListener('drop', (e) => {
    e.preventDefault();
    document.body.classList.remove('dragging');
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('audio/')) {
        handleFile(files[0]);
    } else {
        showError('Please drop a valid audio file.');
    }
});

// Play/Pause
playPauseButton.addEventListener('click', function () {
    if (!audioFileLoaded) {
        showError('Please select a song first!');
    } else {
        if (isPlaying) {
            audio.pause();
            playPauseButton.textContent = '▶️';
        } else {
            audio.play();
            playPauseButton.textContent = '⏸️';
        }
        isPlaying = !isPlaying;
    }
});

// Stop
stopButton.addEventListener('click', function () {
    audio.pause();
    audio.currentTime = 0;
    isPlaying = false;
    playPauseButton.textContent = '▶️';
    progress.style.width = '0%';
    timeDisplay.textContent = '0:00 / 0:00';
    songTitle.textContent = 'No song selected';
    audioFileLoaded = false;
    fileInput.value = '';
    audio.removeEventListener('timeupdate', updateTimeDisplay);
});

// Progress Bar & Time
function updateTimeDisplay() {
    if (audio.duration) {
        const currentTime = formatTime(audio.currentTime);
        const duration = formatTime(audio.duration);
        timeDisplay.textContent = `${currentTime} / ${duration}`;
        const progressPercent = (audio.currentTime / audio.duration) * 100;
        progress.style.width = progressPercent + '%';
    }
}
progressBar.addEventListener('click', function (e) {
    const progressWidth = this.clientWidth;
    const clickX = e.offsetX;
    const duration = audio.duration;
    if (duration) {
        audio.currentTime = (clickX / progressWidth) * duration;
    }
});

audio.addEventListener('ended', () => {
    isPlaying = false;
    playPauseButton.textContent = '▶️';
});

// Volume
volumeSlider.addEventListener('input', function () {
    audio.volume = this.value;
});

// Format Time
function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const minutes = Math.floor(seconds / 60);
    seconds = Math.floor(seconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Error Panel
function showError(msg) {
    const errorMessage = document.getElementById('error-message');
    errorMessage.textContent = msg;
    errorPanel.classList.add('visible');
    errorPanel.classList.remove('hidden');
    setTimeout(hideError, 2500);
}
function hideError() {
    errorPanel.classList.add('hidden');
    errorPanel.classList.remove('visible');
}

// Loop
loopButton.addEventListener('click', function () {
    isLooping = !isLooping;
    audio.loop = isLooping;
    loopButton.textContent = isLooping ? '🔂' : '🔁';
});