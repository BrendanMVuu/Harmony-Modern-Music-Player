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
let isPlaying = false;

// File Loading
fileInput.addEventListener('change', function () {
    const file = this.files[0];
    if (file) {
        const fileURL = URL.createObjectURL(file);
        audio.src = fileURL;
        songTitle.textContent = file.name;
        isPlaying = false;
        playPauseButton.textContent = '▶️';
        progress.style.width = '0%'; // Reset progress bar
        timeDisplay.textContent = '0:00 / 0:00'; // Reset time display
    }
});

// Play/Pause Functionality
playPauseButton.addEventListener('click', function () {
    const errorPanel = document.getElementById('error-panel');
    const errorMessage = document.getElementById('error-message');

    if (audio.src) {
        if (isPlaying) {
            audio.pause();
            playPauseButton.textContent = '▶️';
        } else {
            audio.play();
            playPauseButton.textContent = '⏸️';
        }
        isPlaying = !isPlaying;

        // Hide the error panel if it is visible
        errorPanel.classList.remove('visible');
        errorPanel.classList.add('hidden');
    } else {
        // Show the error panel with the sliding effect
        errorMessage.textContent = 'Please select a song first!';
        errorPanel.classList.remove('hidden');
        errorPanel.classList.add('visible');

        // Automatically hide the error panel after 3 seconds
        setTimeout(() => {
            errorPanel.classList.remove('visible');
            errorPanel.classList.add('hidden');
        }, 3000);
    }
});

// Stop Functionality
stopButton.addEventListener('click', function () {
    audio.pause();
    audio.currentTime = 0;
    isPlaying = false;
    playPauseButton.textContent = '▶️';
    progress.style.width = '0%'; // Reset progress bar
    timeDisplay.textContent = '0:00 / 0:00'; // Reset time display
});

// Update Progress Bar and Time
audio.addEventListener('timeupdate', function () {
    if (audio.duration) {
        const currentTime = formatTime(audio.currentTime);
        const duration = formatTime(audio.duration);
        timeDisplay.textContent = `${currentTime} / ${duration}`;

        const progressPercent = (audio.currentTime / audio.duration) * 100;
        progress.style.width = progressPercent + '%';
    }
});

// Seek Functionality
progressBar.addEventListener('click', function (e) {
    const progressWidth = this.clientWidth;
    const clickX = e.offsetX;
    const duration = audio.duration;

    if (duration) {
        audio.currentTime = (clickX / progressWidth) * duration;
    }
});

// Volume Control
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