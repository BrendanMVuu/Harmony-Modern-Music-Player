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
const logo = document.getElementById('logo');
let isPlaying = false;
let audioFileLoaded = false; // Track whether an audio file is loaded

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
        audioFileLoaded = true; // Mark that an audio file is loaded
        console.log('Audio file loaded:', fileInput.files[0].name);

        // Time update event listener
        audio.addEventListener('timeupdate', updateTimeDisplay);
    }
});

// Play/Pause Functions 
playPauseButton.addEventListener('click', function () {
    const errorMessage = document.getElementById('error-message');

    if (!audioFileLoaded) {
        // Show the error panel if no audio file is loaded
        errorMessage.textContent = 'Please select a song first!';
        showError();
    } else {
        // Toggle play/pause functionality
        if (isPlaying) {
            audio.pause();
            playPauseButton.textContent = '▶️'; // Update button to play icon
        } else {
            audio.play();
            playPauseButton.textContent = '⏸️'; // Update button to pause icon
        }
        isPlaying = !isPlaying; // Toggle the isPlaying state
    }
});

// Stop Functionality
stopButton.addEventListener('click', function () {
    audio.pause(); // Pause the audio
    audio.currentTime = 0; // Reset the audio to the beginning
    isPlaying = false; // Update the playing state
    playPauseButton.textContent = '▶️'; // Reset the play button icon
    progress.style.width = '0%'; // Reset the progress bar
    timeDisplay.textContent = '0:00 / 0:00'; // Reset the time display completely
    songTitle.textContent = 'No song selected'; // Clear the song title
    audioFileLoaded = false; // Mark that no audio file is loaded

    // Remove the timeupdate event listener temporarily
    audio.removeEventListener('timeupdate', updateTimeDisplay);
});

// Function to update the progress bar and time display
function updateTimeDisplay() {
    if (audio.duration) {
        const currentTime = formatTime(audio.currentTime);
        const duration = formatTime(audio.duration);
        timeDisplay.textContent = `${currentTime} / ${duration}`;

        const progressPercent = (audio.currentTime / audio.duration) * 100;
        progress.style.width = progressPercent + '%';
    }
}

// Attach the timeupdate event listener
audio.addEventListener('timeupdate', updateTimeDisplay);

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

// Function to show the error panel and hide the logo
function showError() {
    errorPanel.classList.add('visible');
    errorPanel.classList.remove('hidden');
    logo.classList.add('hidden'); // Hide the logo
    setTimeout(hideError, 3000); // Automatically hide the error after 3 seconds
}

// Function to hide the error panel and show the logo
function hideError() {
    errorPanel.classList.add('hidden');
    errorPanel.classList.remove('visible');
    logo.classList.remove('hidden'); // Show the logo
}

//Loop button function 
const loopButton = document.getElementById('loop');

// Tracking whether looping is enabled
let isLooping = false;

// Loop button event listener
loopButton.addEventListener('click', function () {
    isLooping = !isLooping; // The Looping State
    audio.loop = isLooping; // Audio loop property

    if (isLooping) {
        loopButton.textContent = '🔂'; // Indicating Looping is enabled (On)

    } else {
            loopButton.textContent = '🔁'; // Indicating Looping is disabled (Off)
        }
    });