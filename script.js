// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    // Hide welcome screen after 2 seconds
    setTimeout(() => {
        document.getElementById('welcome-screen').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('welcome-screen').style.display = 'none';
        }, 500);
    }, 2000);
    
    // Audio context and elements
    let audioContext;
    let analyser;
    let audioElement = new Audio();
    let currentSongIndex = 0;
    let songs = [];
    let isPlaying = false;
    let isShuffle = false;
    let isRepeat = false;
    let currentTheme = 'system';
    let currentColor = 'indigo';
    let shuffledPlaylist = []; // Array to track shuffled order
    let shuffleIndex = 0; // Current position in shuffle
    
    // Set up the ended event handler once
    audioElement.addEventListener('ended', () => {
        // Important: Set isPlaying to false when song ends
        isPlaying = false;
        playBtn.innerHTML = '<i class="fas fa-play text-xl"></i>';
        
        if (isRepeat) {
            // If repeat is on, replay the same song
            audioElement.currentTime = 0;
            audioElement.play()
                .then(() => {
                    isPlaying = true;
                    playBtn.innerHTML = '<i class="fas fa-pause text-xl"></i>';
                });
        } else if (songs.length > 1) {
            // Only auto-advance if there are multiple songs
            playNext();
        }
    });
    
    // Set up timeupdate event listener once to avoid multiple listeners
    audioElement.addEventListener('timeupdate', updateProgressBar);
    
    // DOM elements
    const uploadContainer = document.getElementById('upload-container');
    const uploadBtn = document.getElementById('upload-btn');
    const fileInput = document.getElementById('file-input');
    const playerUI = document.getElementById('player-ui');
    const nowPlayingTitle = document.getElementById('now-playing-title');
    const nowPlayingArtist = document.getElementById('now-playing-artist');
    const playBtn = document.getElementById('play-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const shuffleBtn = document.getElementById('shuffle-btn');
    const repeatBtn = document.getElementById('repeat-btn');
    const progressBar = document.getElementById('progress-bar');
    const progressFill = document.getElementById('progress-fill');
    const currentTimeEl = document.getElementById('current-time');
    const durationEl = document.getElementById('duration');
    const playlistSidebar = document.getElementById('playlist-sidebar');
    const playlistToggle = document.getElementById('playlist-toggle');
    const closePlaylist = document.getElementById('close-playlist');
    const playlist = document.getElementById('playlist');
    const historyList = document.getElementById('history-list');
    const playerTab = document.getElementById('player-tab');
    const historyTab = document.getElementById('history-tab');
    const settingsTab = document.getElementById('settings-tab');
    const playerSection = document.getElementById('player-section');
    const historySection = document.getElementById('history-section');
    const settingsSection = document.getElementById('settings-section');
    
    // Initialize audio context on first user interaction
    function initAudioContext() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 32;
            
            const source = audioContext.createMediaElementSource(audioElement);
            source.connect(analyser);
            analyser.connect(audioContext.destination);
        }
    }
    
    // Update progress bar fill
    function updateProgressBar() {
        if (!audioElement.duration) {
            progressFill.style.width = '0%';
            return;
        }
        const percent = (audioElement.currentTime / audioElement.duration) * 100;
        progressFill.style.width = percent + '%';
    }

    // Seek on progress bar click
    progressBar.addEventListener('click', (e) => {
        if (!audioElement.duration) return;
        const rect = progressBar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        audioElement.currentTime = percent * audioElement.duration;
        updateProgressBar();
        updateTimeDisplay();
    });

    // Update time display and progress bar
    function updateTimeDisplay() {
        const currentTime = audioElement.currentTime;
        currentTimeEl.textContent = formatTime(currentTime);
        
        // Only update duration if we don't have it set yet
        if (audioElement.duration && !isNaN(audioElement.duration) && durationEl.textContent === "0:00") {
            durationEl.textContent = formatTime(audioElement.duration);
        }
        
        updateProgressBar();
        if (isPlaying) {
            requestAnimationFrame(updateTimeDisplay);
        }
    }
    
    // Update player UI with current song
    function updatePlayerUI() {
        if (songs.length === 0) return;
        
        const song = songs[currentSongIndex];
        nowPlayingTitle.textContent = song.name;
        nowPlayingArtist.textContent = song.artist;
        
        // Update playlist active item
        const playlistItems = playlist.querySelectorAll('.playlist-item');
        playlistItems.forEach((item, index) => {
            if (index === currentSongIndex) {
                item.classList.add('bg-indigo-100', 'dark:bg-gray-700');
            } else {
                item.classList.remove('bg-indigo-100', 'dark:bg-gray-700');
            }
        });
    }
    
    // Play song
    function playSong(index) {
        if (songs.length === 0) return;
        if (index >= songs.length) index = 0;
        if (index < 0) index = songs.length - 1;
        
        const song = songs[index];
        
        // Don't add to history if it's the same song and already playing
        if (currentSongIndex !== index || !isPlaying) {
            addToHistory(song);
        }

        // If it's the same song and already playing, don't restart
        if (currentSongIndex === index && isPlaying) {
            return;
        }
        
        currentSongIndex = index;
        renderPlaylist();

        // Reset audio element completely
        audioElement.pause();
        audioElement.currentTime = 0;
        
        // Reset UI immediately
        durationEl.textContent = "0:00";
        currentTimeEl.textContent = "0:00";
        progressFill.style.width = '0%';

        // Set source and load
        audioElement.src = song.url;
        audioElement.load(); // Force reload

        // Function to check and update duration
        const checkDuration = () => {
            if (audioElement.duration && !isNaN(audioElement.duration)) {
                durationEl.textContent = formatTime(audioElement.duration);
                updateProgressBar();
                return true;
            }
            return false;
        };

        // Try to play and handle duration loading
        audioElement.play()
            .then(() => {
                isPlaying = true;
                playBtn.innerHTML = '<i class="fas fa-pause text-xl"></i>';
                updatePlayerUI();
                updateTimeDisplay();
                
                // Check duration immediately
                if (!checkDuration()) {
                    // If duration not available, keep checking
                    let attempts = 0;
                    const durationInterval = setInterval(() => {
                        if (checkDuration() || attempts > 50) { // Stop after 5 seconds
                            clearInterval(durationInterval);
                        }
                        attempts++;
                    }, 100); // Check every 100ms
                }
            })
            .catch(error => {
                console.error('Playback failed:', error);
            });
    }
    
    // Pause song
    function pauseSong() {
        audioElement.pause();
        isPlaying = false;
        playBtn.innerHTML = '<i class="fas fa-play text-xl"></i>';
    }
    
    // Toggle play/pause
    function togglePlay() {
        if (songs.length === 0) return;
        
        if (isPlaying) {
            pauseSong();
        } else {
            playSong(currentSongIndex);
        }
    }
    
    // Create shuffled playlist
    function createShuffledPlaylist() {
        shuffledPlaylist = Array.from({length: songs.length}, (_, i) => i);
        // Fisher-Yates shuffle algorithm
        for (let i = shuffledPlaylist.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledPlaylist[i], shuffledPlaylist[j]] = [shuffledPlaylist[j], shuffledPlaylist[i]];
        }
        shuffleIndex = 0;
    }
    
    // Play next song
    function playNext() {
        if (songs.length === 0) return;
        
        if (isShuffle && songs.length > 1) {
            // Use shuffled playlist for next song
            if (shuffledPlaylist.length === 0 || shuffleIndex >= shuffledPlaylist.length) {
                createShuffledPlaylist();
                // Put current song at beginning and set index for next
                const currentPos = shuffledPlaylist.indexOf(currentSongIndex);
                if (currentPos !== -1) {
                    shuffledPlaylist.splice(currentPos, 1);
                    shuffledPlaylist.unshift(currentSongIndex);
                }
                shuffleIndex = 1;
            }
            currentSongIndex = shuffledPlaylist[shuffleIndex];
            shuffleIndex++;
        } else {
            // Normal sequential play
            currentSongIndex = (currentSongIndex + 1) % songs.length;
        }
        
        playSong(currentSongIndex);
    }
    
    // Play previous song
    function playPrev() {
        if (songs.length === 0) return;
        
        if (isShuffle) {
            // Go back in shuffle order
            if (shuffleIndex > 1) {
                shuffleIndex -= 2; // Go back two positions
                currentSongIndex = shuffledPlaylist[shuffleIndex];
                shuffleIndex++; // Will be used for next song
            } else {
                // If at beginning, wrap to a random song
                shuffleIndex = 0;
                currentSongIndex = shuffledPlaylist[Math.floor(Math.random() * shuffledPlaylist.length)];
            }
        } else {
            currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
        }
        
        playSong(currentSongIndex);
    }
    
    // Toggle shuffle
    function toggleShuffle() {
        isShuffle = !isShuffle;
        if (isShuffle) {
            shuffleBtn.classList.add('text-indigo-600', 'dark:text-indigo-400');
            // Create shuffled playlist when shuffle is enabled
            createShuffledPlaylist();
            // Put current song at the beginning of the shuffle and set next position
            const currentPos = shuffledPlaylist.indexOf(currentSongIndex);
            if (currentPos !== -1) {
                // Move current song to the front of the shuffled playlist
                shuffledPlaylist.splice(currentPos, 1);
                shuffledPlaylist.unshift(currentSongIndex);
            }
            shuffleIndex = 1; // Next song will be the second song in shuffled order
        } else {
            shuffleBtn.classList.remove('text-indigo-600', 'dark:text-indigo-400');
            // Clear shuffle data when disabled
            shuffledPlaylist = [];
            shuffleIndex = 0;
        }
    }
    
    // Toggle repeat
    function toggleRepeat() {
        isRepeat = !isRepeat;
        if (isRepeat) {
            repeatBtn.classList.add('text-indigo-600', 'dark:text-indigo-400');
            // Don't set audioElement.loop = true, we'll handle repeat in the ended event
        } else {
            repeatBtn.classList.remove('text-indigo-600', 'dark:text-indigo-400');
            audioElement.loop = false;
        }
    }
    
    // Add song to playlist
    function addSongToPlaylist(song, index) {
        const playlistItem = document.createElement('div');
        playlistItem.className = `playlist-item flex items-center p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors`;
        playlistItem.dataset.index = index;

        playlistItem.innerHTML = `
            <div class="flex-shrink-0 w-10 h-10 bg-indigo-100 dark:bg-gray-700 rounded flex items-center justify-center mr-3">
                <i class="fas fa-music text-indigo-600 dark:text-indigo-400"></i>
            </div>
            <div class="flex-1 min-w-0">
                <h4 class="text-sm font-medium truncate">${song.name}</h4>
                ${song.artist ? `<p class="text-xs text-gray-500 dark:text-gray-400 truncate">${song.artist}</p>` : ''}
            </div>
        `;

        // Use mousedown for instant feedback instead of click
        playlistItem.addEventListener('mousedown', (e) => {
            e.preventDefault();
            playSong(Number(playlistItem.dataset.index));
        });

        playlist.appendChild(playlistItem);
    }
    
    // When adding a new song, re-render the playlist to fix event binding and active state
    function renderPlaylist() {
        playlist.innerHTML = '';
        songs.forEach((song, idx) => addSongToPlaylist(song, idx));
        // Highlight the current song
        const playlistItems = playlist.querySelectorAll('.playlist-item');
        playlistItems.forEach((item, idx) => {
            if (idx === currentSongIndex) {
                item.classList.add('bg-indigo-100', 'dark:bg-gray-700');
            }
        });
    }
    
    // Add song to history (show all songs, including duplicates, most recent first)
    function addToHistory(song) {
        // Do not remove existing history items, just add new one to the top
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center';
        historyItem.dataset.songUrl = song.url;

        historyItem.innerHTML = `
            <div class="flex-shrink-0 w-12 h-12 bg-indigo-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mr-4">
                <i class="fas fa-music text-indigo-600 dark:text-indigo-400"></i>
            </div>
            <div class="flex-1 min-w-0">
                <h4 class="text-sm font-medium truncate">${song.name}</h4>
                ${song.artist ? `<p class="text-xs text-gray-500 dark:text-gray-400 truncate">${song.artist}</p>` : ''}
            </div>
            <div class="text-sm text-gray-500 dark:text-gray-400">
                ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </div>
        `;

        // Add to top of history
        historyList.insertBefore(historyItem, historyList.firstChild);
    }
    
    // Handle file upload
    function handleFiles(files) {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.type === 'audio/mpeg' || file.name.endsWith('.mp3')) {
                const song = {
                    name: getSongName(file.name),
                    url: URL.createObjectURL(file)
                };
                songs.push(song);
            }
        }
        
        // Reset shuffle playlist when new songs are added
        if (isShuffle) {
            createShuffledPlaylist();
        }
        
        renderPlaylist();
        if (songs.length > 0) {
            uploadContainer.classList.add('hidden');
            playerUI.classList.remove('hidden');
            // Play the first song if not already playing
            if (!isPlaying) {
                playSong(0);
            }
        }
    }
    
    // Drag and drop functionality
    uploadContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadContainer.classList.add('drag-active');
    });
    
    uploadContainer.addEventListener('dragleave', () => {
        uploadContainer.classList.remove('drag-active');
    });
    
    uploadContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadContainer.classList.remove('drag-active');
        
        if (e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    });
    
    // File input change
    uploadBtn.addEventListener('click', () => {
        fileInput.click();
    });
    
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            handleFiles(fileInput.files);
            fileInput.value = ''; // Reset input to allow selecting same file again
        }
    });
    
    // Playlist toggle
    playlistToggle.addEventListener('click', () => {
        playlistSidebar.classList.toggle('translate-x-0');
    });
    
    closePlaylist.addEventListener('click', () => {
        playlistSidebar.classList.remove('translate-x-0');
    });
    
    // Player controls
    playBtn.addEventListener('click', togglePlay);
    prevBtn.addEventListener('click', playPrev);
    nextBtn.addEventListener('click', playNext);
    shuffleBtn.addEventListener('click', toggleShuffle);
    repeatBtn.addEventListener('click', toggleRepeat);
    
    // Fix: Add tab switching for sidebar buttons with smooth animations
    function switchToSection(targetSection) {
        const sections = [playerSection, historySection, settingsSection];
        const tabs = [playerTab, historyTab, settingsTab];
        
        // Find current active section
        const currentSection = sections.find(section => !section.classList.contains('hidden'));
        
        if (currentSection && currentSection !== targetSection) {
            // Add exit animation to current section
            currentSection.classList.add('page-transition', 'slide-up-exit');
            
            setTimeout(() => {
                // Hide current section after exit animation
                currentSection.classList.add('hidden');
                currentSection.classList.remove('page-transition', 'slide-up-exit');
                
                // Show target section with enter animation
                targetSection.classList.remove('hidden');
                targetSection.classList.add('page-transition', 'slide-down-enter');
                
                setTimeout(() => {
                    targetSection.classList.remove('page-transition', 'slide-down-enter');
                }, 400);
            }, 200);
        } else if (!currentSection) {
            // No current section, just show target with animation
            sections.forEach(section => section.classList.add('hidden'));
            targetSection.classList.remove('hidden');
            targetSection.classList.add('page-transition', 'slide-down-enter');
            
            setTimeout(() => {
                targetSection.classList.remove('page-transition', 'slide-down-enter');
            }, 400);
        }
        
        // Update tab styles
        tabs.forEach(tab => {
            tab.classList.remove('bg-indigo-100', 'dark:bg-gray-700', 'text-indigo-600', 'dark:text-indigo-400');
            tab.classList.add('text-gray-500', 'dark:text-gray-400');
        });
        
        // Activate the clicked tab
        if (targetSection === playerSection) {
            playerTab.classList.add('bg-indigo-100', 'dark:bg-gray-700', 'text-indigo-600', 'dark:text-indigo-400');
            playerTab.classList.remove('text-gray-500', 'dark:text-gray-400');
        } else if (targetSection === historySection) {
            historyTab.classList.add('bg-indigo-100', 'dark:bg-gray-700', 'text-indigo-600', 'dark:text-indigo-400');
            historyTab.classList.remove('text-gray-500', 'dark:text-gray-400');
        } else if (targetSection === settingsSection) {
            settingsTab.classList.add('bg-indigo-100', 'dark:bg-gray-700', 'text-indigo-600', 'dark:text-indigo-400');
            settingsTab.classList.remove('text-gray-500', 'dark:text-gray-400');
        }
    }
    
    playerTab.addEventListener('click', () => {
        switchToSection(playerSection);
    });

    historyTab.addEventListener('click', () => {
        switchToSection(historySection);
    });

    settingsTab.addEventListener('click', () => {
        switchToSection(settingsSection);
    });
});

// Format time in MM:SS format
function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Fix: Ensure song name is not cut off by removing file extension only, not the last parenthesis
function getSongName(filename) {
    // Remove only the last .mp3 or .mpeg extension, not the last parenthesis
    return filename.replace(/\.(mp3|mpeg)$/i, '');
}