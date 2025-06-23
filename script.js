// Player
let uploadedSongs = [];
let currentSong = null;
let currentIndex = 0;
let isPlaying = false;
let volume = 70;
let isMuted = false;
let deleteIndex = -1;
let deleteTimer = null;

// Audio element
const audioPlayer = document.getElementById('mainAudioPlayer');

// App Initialize 
function initApp() {
    setupUploadHandlers();
    setupAudioEventListeners();
    updateDisplay();
}

// Setup audio and event listeners
function setupAudioEventListeners() {
    audioPlayer.addEventListener('loadedmetadata', () => {
        updateCurrentSongInfo();
        updateTimeDisplays();
    });

    audioPlayer.addEventListener('timeupdate', () => {
        updateProgressBar();
        updateTimeDisplays();
    });

    audioPlayer.addEventListener('play', () => {
        isPlaying = true;
        updatePlayButton();
        updatePlaylist();
    });

    audioPlayer.addEventListener('pause', () => {
        isPlaying = false;
        updatePlayButton();
        updatePlaylist();
    });

    audioPlayer.addEventListener('ended', () => {
        nextSong();
    });

    // Set initial volume
    audioPlayer.volume = volume / 100;
}

// Upload handlers
function setupUploadHandlers() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');

    // Drag and drop handlers
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.add('drag-over');
    });

    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.remove('drag-over');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.remove('drag-over');
        handleFiles(e.dataTransfer.files);
    });

    // Click to upload (make sure this works)
    uploadArea.addEventListener('click', (e) => {
        // Only trigger file input if not clicking on a button or if clicking on upload area directly
        if (e.target === uploadArea || e.target.classList.contains('upload-icon') || 
            e.target.classList.contains('upload-text') || e.target.classList.contains('upload-subtext')) {
            fileInput.click();
        }
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
        console.log('File input changed. Files:', e.target.files ? e.target.files.length : 0);
        if (e.target.files && e.target.files.length > 0) {
            handleFiles(e.target.files);
        } else {
            console.log('No files selected or file input is empty');
        }
    });
}

// Handle uploaded files
function handleFiles(files) {
    console.log('handleFiles called with:', files.length, 'files');
    let filesAdded = false;
    
    Array.from(files).forEach(file => {
        console.log('Processing file:', file.name, 'Type:', file.type);
        
        // More flexible MP3 detection
        const isMP3 = file.type === 'audio/mpeg' || 
                     file.type === 'audio/mp3' || 
                     file.name.toLowerCase().endsWith('.mp3') ||
                     file.type === 'audio/mpeg3' ||
                     file.type === 'audio/x-mpeg-3';
        
        if (isMP3) {
            console.log('File accepted as MP3:', file.name);
            
            const url = URL.createObjectURL(file);
            const song = {
                id: Date.now() + Math.random(),
                title: file.name.replace(/\.mp3$/i, ''),
                artist: 'Unknown Artist',
                file: file,
                url: url,
                duration: 0
            };
            
            uploadedSongs.push(song);
            filesAdded = true;
            console.log('Song added to array. Total songs:', uploadedSongs.length);
            
            // Get duration
            const tempAudio = new Audio(url);
            tempAudio.addEventListener('loadedmetadata', () => {
                song.duration = tempAudio.duration;
                console.log('Duration loaded for:', song.title, '- Duration:', song.duration);
                updateDisplay();
                updatePlaylist();
                updateSongCount();
            });
            
            // Also trigger error handler to catch issues
            tempAudio.addEventListener('error', (e) => {
                console.error('Error loading audio file:', file.name, e);
            });
        } else {
            console.log('File rejected - not MP3:', file.name, 'Type:', file.type);
        }
    });
    
    // Immediately update display if files were added
    if (filesAdded) {
        console.log('Files added, updating display...');
        updateDisplay();
        
        // Clear the file input to allow re-uploading the same file
        document.getElementById('fileInput').value = '';
    } else {
        console.log('No valid MP3 files were found');
        alert('Please select valid MP3 files only.');
    }
}

// Update display
function updateDisplay() {
    console.log('updateDisplay called. Songs count:', uploadedSongs.length);
    
    const uploadSection = document.getElementById('uploadArea');
    const playerSection = document.getElementById('playerSection');
    
    if (uploadedSongs.length === 0) {
        console.log('No songs - showing upload section');
        uploadSection.style.display = 'block';
        playerSection.classList.remove('active');
    } else {
        console.log('Songs found - showing player section');
        uploadSection.style.display = 'none';
        playerSection.classList.add('active');
        updatePlaylist();
        updateSongCount();
        
        // Auto-play first song if none is selected
        if (!currentSong) {
            console.log('Auto-playing first song');
            playSong(0);
        }
    }
}

// Update playlist
function updatePlaylist() {
    const playlistContainer = document.getElementById('playlistContainer');
    playlistContainer.innerHTML = '';

    uploadedSongs.forEach((song, index) => {
        const item = document.createElement('div');
        item.className = `playlist-item ${index === currentIndex ? 'active' : ''}`;
        item.onclick = () => playSong(index);
        
        // Fixed play emoji logic: show play icon only if this song is current AND playing
        const playIcon = (index === currentIndex && isPlaying) 
            ? '<i class="fas fa-play" style="color: #ff6b6b;"></i>' 
            : (index + 1);
        
        // Create delete button with unique identifier
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.title = 'Delete song';
        deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            showDeleteModal(index);
        };
        
        item.innerHTML = `
            <div style="width: 20px; text-align: center;">
                ${playIcon}
            </div>
            <div class="playlist-item-info">
                <div class="playlist-item-title">${song.title}</div>
            </div>
            <div class="playlist-item-duration">${formatTime(song.duration)}</div>
        `;
        
        item.appendChild(deleteBtn);
        playlistContainer.appendChild(item);
    });
}

// Update song count
function updateSongCount() {
    document.getElementById('songCount').textContent = uploadedSongs.length;
}

// Play song
function playSong(index) {
    if (index < 0 || index >= uploadedSongs.length) return;
    
    currentSong = uploadedSongs[index];
    currentIndex = index;
    
    // Update main audio player
    audioPlayer.src = currentSong.url;
    audioPlayer.load();
    
    // Update UI
    updateCurrentSongInfo();
    updatePlaylist();
    
    // Auto play
    audioPlayer.play().catch(e => console.log('Play prevented:', e));
}

// Update current song info
function updateCurrentSongInfo() {
    if (currentSong) {
        document.getElementById('currentSongTitle').textContent = currentSong.title;
        // Use audioPlayer.duration if available, fallback to currentSong.duration
        const duration = audioPlayer.duration && !isNaN(audioPlayer.duration) ? audioPlayer.duration : currentSong.duration;
        document.getElementById('currentDuration').textContent = formatTime(duration);
    }
}

// Toggle play/pause
function togglePlay() {
    if (!currentSong) {
        if (uploadedSongs.length > 0) {
            playSong(0);
        }
        return;
    }
    
    if (isPlaying) {
        audioPlayer.pause();
    } else {
        audioPlayer.play().catch(e => console.log('Play prevented:', e));
    }
}

// Update play button
function updatePlayButton() {
    const playIcon = document.getElementById('playIcon');
    playIcon.className = isPlaying ? 'fas fa-pause' : 'fas fa-play';
}

// Previous song
function previousSong() {
    if (uploadedSongs.length === 0) return;
    
    let newIndex = currentIndex - 1;
    if (newIndex < 0) {
        newIndex = uploadedSongs.length - 1;
    }
    playSong(newIndex);
}

// Next song
function nextSong() {
    if (uploadedSongs.length === 0) return;
    
    let newIndex = currentIndex + 1;
    if (newIndex >= uploadedSongs.length) {
        newIndex = 0;
    }
    playSong(newIndex);
}

// Show delete confirmation modal
function showDeleteModal(index) {
    deleteIndex = index;
    const songTitle = uploadedSongs[index].title;
    document.getElementById('modalMessage').innerHTML = `Are you sure you want to remove<br><strong>"${songTitle}"</strong><br>from your playlist?`;
    document.getElementById('deleteModal').classList.add('show');
}

// Reset delete modal state
function resetDeleteModal() {
    const confirmBtn = document.getElementById('confirmBtn');
    const timerDisplay = document.getElementById('timerDisplay');
    confirmBtn.disabled = false;
    confirmBtn.textContent = 'Yes, Remove';
    timerDisplay.style.display = 'none';
}

// Hide delete modal
function hideDeleteModal() {
    document.getElementById('deleteModal').classList.remove('show');
    deleteIndex = -1;
    if (deleteTimer) {
        clearInterval(deleteTimer);
        deleteTimer = null;
    }
    resetDeleteModal();
}

// Confirm delete with timer
function confirmDelete() {
    if (deleteIndex === -1) return;
    
    const confirmBtn = document.getElementById('confirmBtn');
    const timerDisplay = document.getElementById('timerDisplay');
    
    // Disable button and show timer
    confirmBtn.disabled = true;
    timerDisplay.style.display = 'block';
    
    let timeLeft = 3;
    timerDisplay.textContent = `Removing in ${timeLeft} seconds...`;
    confirmBtn.textContent = `Removing (${timeLeft})`;
    
    deleteTimer = setInterval(() => {
        timeLeft--;
        if (timeLeft > 0) {
            timerDisplay.textContent = `Removing in ${timeLeft} seconds...`;
            confirmBtn.textContent = `Removing (${timeLeft})`;
        } else {
            clearInterval(deleteTimer);
            deleteTimer = null;
            executeDelete();
            hideDeleteModal();
        }
    }, 1000);
}

// Execute the actual delete
function executeDelete() {
    if (deleteIndex === -1 || deleteIndex >= uploadedSongs.length) return;
    const index = deleteIndex;
    
    // Revoke object URL to free memory
    URL.revokeObjectURL(uploadedSongs[index].url);
    
    // If deleting current song, stop playback
    if (index === currentIndex) {
        audioPlayer.pause();
        audioPlayer.src = '';
        isPlaying = false;
        currentSong = null;
    }
    
    // Remove from array
    uploadedSongs.splice(index, 1);
    
    // Adjust current index if necessary
    if (currentIndex > index) {
        currentIndex--;
    } else if (currentIndex === index && uploadedSongs.length > 0) {
        // If we deleted the current song, ensure index is valid
        if (currentIndex >= uploadedSongs.length) {
            currentIndex = uploadedSongs.length - 1;
        }
    } else if (uploadedSongs.length === 0) {
        currentIndex = 0;
        currentSong = null;
    }
    
    // If we still have songs and deleted current song, play next available
    if (uploadedSongs.length > 0 && !currentSong) {
        if (currentIndex >= uploadedSongs.length) {
            currentIndex = 0;
        }
        playSong(currentIndex);
    }
    
    // Reset delete state
    deleteIndex = -1;
    
    // Update display
    updateDisplay();
    resetDeleteModal();
}

// Update progress bar
function updateProgressBar() {
    const progressBar = document.getElementById('progressBar');
    if (audioPlayer.duration) {
        const percentage = (audioPlayer.currentTime / audioPlayer.duration) * 100;
        progressBar.style.width = percentage + '%';
    }
}

// Update time displays
function updateTimeDisplays() {
    document.getElementById('currentTimeDisplay').textContent = formatTime(audioPlayer.currentTime || 0);
    document.getElementById('totalTimeDisplay').textContent = formatTime(audioPlayer.duration || 0);
}

// Seek to position
function seekTo(event) {
    if (!audioPlayer.duration) return;
    
    const progressContainer = event.currentTarget;
    const rect = progressContainer.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = clickX / rect.width;
    
    audioPlayer.currentTime = audioPlayer.duration * percentage;
}

// Set volume
function setVolume(value) {
    volume = value;
    audioPlayer.volume = value / 100;
    if (value == 0) {
        isMuted = true;
        audioPlayer.muted = true;
    } else {
        if (isMuted) {
            isMuted = false;
            audioPlayer.muted = false;
        }
    }
    updateVolumeIcon();
}

// Toggle mute
function toggleMute() {
    isMuted = !isMuted;
    audioPlayer.muted = isMuted;
    updateVolumeIcon();
}

// Update volume icon
function updateVolumeIcon() {
    const volumeIcon = document.getElementById('volumeIcon');
    if (isMuted || volume === 0) {
        volumeIcon.className = 'fas fa-volume-mute volume-icon';
    } else if (volume < 50) {
        volumeIcon.className = 'fas fa-volume-down volume-icon';
    } else {
        volumeIcon.className = 'fas fa-volume-up volume-icon';
    }
}

// Format time
function formatTime(seconds) {
    if (isNaN(seconds) || seconds === 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Initialize app when page loads
window.addEventListener('load', initApp);