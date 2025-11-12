const image = document.getElementById("cover"),
  title = document.getElementById("music-title"),
  artist = document.getElementById("music-artist"),
  currentTimeEl = document.getElementById("current-time"),
  durationEl = document.getElementById("duration"),
  progress = document.getElementById("progress"),
  playerProgress = document.getElementById("player-progress"),
  prevBtn = document.getElementById("prev"),
  playBtn = document.getElementById("play"),
  nextBtn = document.getElementById("next"),
  background = document.getElementById("bg-img"),
  volumeSlider = document.getElementById("volume-slider"),
  fileChosen = document.getElementById("file-chosen"),
  musicUpload = document.getElementById("music-upload"),
  uploadBtn = document.getElementById("upload-button"),
  songListDiv = document.getElementById("song-list");

const music = new Audio();

let songs = [];
let images = [
  "assets/image1.jpg",
  "assets/image2.jpg",
  "assets/image3.jpg",
  "assets/image4.jpg",
  "assets/image5.jpg",
  "assets/image6.jpg",
];
let imageIndex = 0;
let selectedFile = null;
let musicIndex = 0;
let isPlaying = false;
let db;
const upload = indexedDB.open("musicDB", 1);

function togglePlay() {
  if (isPlaying) {
    pauseMusic();
  } else {
    playMusic();
  }
}

function songList() {
  if (!songListDiv) return;

  let list = "<h4>Song List</h4><ul>";

  songs.forEach((song, index) => {
    const name = (song.displayName || song.name || "Unknown").replace(
      /\.[^/.]+$/,
      ""
    );
    list += `<li${
      index === musicIndex ? ' class="active"' : ""
    } data-index="${index}">${name} <span style="font-size:12px;color:#888;">${
      song.artist ? " - " + song.artist : ""
    }</span></li>`;
  });
  list += "</ul>";
  songListDiv.innerHTML = list;

  songListDiv.querySelectorAll("li").forEach((li) => {
    li.addEventListener("click", function () {
      const index = parseInt(this.getAttribute("data-index"));
      if (!isNaN(index)) {
        musicIndex = index;
        loadMusic(songs[musicIndex]);
        playMusic();
        songList();
      }
    });
  });
}

function loadSongs(callback) {
  const transaction = db.transaction(["songs"], "readonly");
  const store = transaction.objectStore("songs");
  const request = store.getAll();

  request.onsuccess = function (evt) {
    songs = evt.target.result;

    if (songs.length > 0) {
      loadMusic(songs[musicIndex]);
      if (callback) callback();
    }
    songList();
  };
}

function loadMusic(song) {
  if (song.data) {
    const blob = new Blob([song.data]);
    music.src = URL.createObjectURL(blob);
    title.textContent = (song.displayName || song.name).replace(
      /\.[^/.]+$/,
      ""
    );
    artist.textContent = song.artist || "Unknown Artist";
    imageIndex = Math.floor(Math.random() * images.length);
    image.src = images[imageIndex];
    background.src = images[imageIndex];
  } else {
    music.src = song.path;
    title.textContent = song.name;
    artist.textContent = song.artist;

    imageIndex = Math.floor(Math.random() * images.length);
    image.src = images[imageIndex];
    background.src = images[imageIndex];
  }
}

upload.onsuccess = function (evt) {
  db = evt.target.result;
  loadSongs();
};

upload.onupgradeneeded = function (evt) {
  db = evt.target.result;
  if (!db.objectStoreNames.contains("songs")) {
    db.createObjectStore("songs", { keyPath: "id", autoIncrement: true });
  }
};

upload.onerror = function (evt) {
  console.error("DB error:" + evt.target.errorCode);
};

uploadBtn.addEventListener("click", function () {
  if (selectedFile && db) {
    const reader = new FileReader();
    reader.onload = function (evt) {
      const transaction = db.transaction(["songs"], "readwrite");
      const store = transaction.objectStore("songs");
      const songData = {
        displayName: selectedFile.name,
        data: evt.target.result,
      };
      const request = store.add(songData);
      request.onsuccess = function () {
        loadSongs(playMusic);
      };
    };
    reader.readAsArrayBuffer(selectedFile);
  } else {
    musicUpload.click();
  }
});

musicUpload.addEventListener("change", function () {
  if (this.files && this.files[0]) {
    selectedFile = this.files[0];
    fileChosen.textContent = `Selected: ${selectedFile.name}`;
  } else {
    selectedFile = null;
  }
});

function playMusic() {
  isPlaying = true;
  playBtn.classList.replace("fa-play", "fa-pause");
  playBtn.setAttribute("title", "Pause");
  music.play();
}

function pauseMusic() {
  isPlaying = false;
  playBtn.classList.replace("fa-pause", "fa-play");
  playBtn.setAttribute("title", "Play");
  music.pause();
}

function changeMusic(direction) {
  if (songs.length === 0) return;
  musicIndex = (musicIndex + direction + songs.length) % songs.length;
  loadMusic(songs[musicIndex]);
  playMusic();
}

function updateProgressBar() {
  const { duration, currentTime } = music;
  const progressPercent = (currentTime / duration) * 100;
  progress.style.width = `${progressPercent}%`;

  const formatTime = (time) => String(Math.floor(time)).padStart(2, "0");
  durationEl.textContent = `${formatTime(duration / 60)}:${formatTime(
    duration % 60
  )}`;
  currentTimeEl.textContent = `${formatTime(currentTime / 60)}:${formatTime(
    currentTime % 60
  )}`;
}

function setProgressBar(e) {
  const width = playerProgress.clientWidth;
  const clickX = e.offsetX;
  music.currentTime = (clickX / width) * music.duration;
}

playBtn.addEventListener("click", togglePlay);
prevBtn.addEventListener("click", () => {
  if (music.currentTime > 3) {
    music.currentTime = 0;
    playMusic();
  } else {
    changeMusic(-1);
  }
});
nextBtn.addEventListener("click", () => changeMusic(1));
music.addEventListener("ended", () => changeMusic(1));
music.addEventListener("timeupdate", updateProgressBar);
playerProgress.addEventListener("click", setProgressBar);
volumeSlider.addEventListener("input", function () {
  music.volume = volumeSlider.value / 100;
});

loadMusic(songs[musicIndex]);
