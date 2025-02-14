const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas dimensions
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Game variables
let player, trashList, obstacles, score, gameOver, gameInterval, currentLevel;
let particles = [];
let fireParticles = [];
let isPaused = false;
let powerUps = [];
let gameIntervals = [];
let highScores = [];
let gameStartTime;

// Ubah konstanta MAX_LEVEL menjadi 7
const MAX_LEVEL = 7; // Diubah dari 10

// Tambahkan sistem achievement
const achievements = {
  trashCollector: {
    name: "Trash Collector",
    description: "Kumpulkan 50 sampah",
    requirement: 50,
    completed: false
  },
  speedRunner: {
    name: "Speed Runner",
    description: "Capai level 3 dalam 60 detik",
    requirement: 60,
    completed: false
  },
  environmentalist: {
    name: "Environmentalist",
    description: "Capai skor 1000",
    requirement: 1000,
    completed: false
  },
  survivor: {
    name: "Survivor",
    description: "Bertahan 3 menit tanpa game over",
    requirement: 180, // dalam detik
    completed: false
  }
};

// Tambahkan variasi power-up baru
const powerUpTypes = ['shield', 'speedBoost', 'magnet', 'timeSlower'];

// Load assets
const playerImg = new Image();
playerImg.src = 'assets/images/player.png';

const trashImg = new Image();
trashImg.src = 'assets/images/trash.png';

const obstacleImg = new Image();
obstacleImg.src = 'assets/images/obstacle.png';

const collectSound = new Audio('assets/sounds/collect.mp3');
const crashSound = new Audio('assets/sounds/crash.mp3');
const levelUpSound = new Audio('assets/sounds/level-up.mp3');
const winSound = new Audio('assets/sounds/win.mp3');

// Tambahkan di bagian atas file setelah deklarasi variabel
const gameMusic = new Audio('assets/sounds/background.mp3');

// Preload musik
gameMusic.addEventListener('canplaythrough', () => {
  console.log('Musik berhasil dimuat');
});

gameMusic.addEventListener('error', (e) => {
  console.error('Error loading music:', e);
});

// Konfigurasi musik
gameMusic.loop = true;
gameMusic.volume = 0.5; // Set volume 50%

// Tambahkan variabel untuk status musik
let isMusicPlaying = false;

// Fungsi untuk mengelola musik
function playMusic(music) {
  try {
    if (!isMusicPlaying) {
      let playPromise = music.play();
      
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log('Musik mulai dimainkan');
          isMusicPlaying = true;
        }).catch(error => {
          console.log("Error playing music:", error);
        });
      }
    }
  } catch (error) {
    console.log("Error playing music:", error);
  }
}

// Fungsi untuk menghentikan musik
function stopMusic(music) {
  music.pause();
  music.currentTime = 0;
  isMusicPlaying = false;
}

// Definisi jenis sampah dan informasinya
const trashTypes = {
  plastic: {
    name: "Sampah Plastik",
    decompositionTime: "450 tahun",
    recyclingTip: "Buat pot tanaman dari botol plastik bekas",
    image: new Image(),
    points: 15
  },
  organic: {
    name: "Sampah Organik",
    decompositionTime: "2-4 minggu",
    recyclingTip: "Jadikan pupuk kompos untuk tanaman",
    image: new Image(),
    points: 5
  },
  paper: {
    name: "Sampah Kertas",
    decompositionTime: "2-5 bulan",
    recyclingTip: "Buat kerajinan dari kertas daur ulang",
    image: new Image(),
    points: 10
  },
  metal: {
    name: "Sampah Logam",
    decompositionTime: "50-100 tahun",
    recyclingTip: "Jual ke pengepul untuk didaur ulang",
    image: new Image(),
    points: 20
  }
};

// Load gambar sampah
Object.keys(trashTypes).forEach(type => {
  trashTypes[type].image.src = `assets/images/trash/${type}.png`;
});

// Preload background images
const backgroundImages = {
  1: new Image(),
  2: new Image(),
  3: new Image(),
  4: new Image(),
  5: new Image(),
  6: new Image(),
  7: new Image()
};

// Load semua background dengan path yang baru
Object.keys(backgroundImages).forEach(level => {
  // Ubah path untuk level tertentu (level 3)
  if (level === '3') {
    backgroundImages[level].src = `assets/images/backgrounds/level3_new.jpg`; 
  } else {
    backgroundImages[level].src = `assets/images/backgrounds/level${level}.jpg`;
  }
  
  // Tambahkan error handling dan logging
  backgroundImages[level].onload = () => {
    console.log(`Background level ${level} berhasil dimuat`);
  };
  
  backgroundImages[level].onerror = () => {
    console.error(`Error loading background for level ${level}: ${backgroundImages[level].src}`);
    // Fallback ke background default jika gagal load
    backgroundImages[level].src = `assets/images/backgrounds/level${level}.jpg`;
  };
});

// Tambahkan variabel untuk mengontrol waktu
let lastTime = 0;
const FPS = 60;
const frameTime = 1000 / FPS;

// Modifikasi fungsi initGame
function initGame() {
  // Bersihkan semua interval yang ada
  gameIntervals.forEach(interval => clearInterval(interval));
  gameIntervals = [];
  
  player = { 
    x: canvas.width / 2, 
    y: canvas.height / 2, 
    width: 50, 
    height: 50, 
    speed: 5 
  };
  
  trashList = [
    createNewTrash(),
    createNewTrash()
  ];
  
  obstacles = [];
  powerUps = [];
  score = 0;
  currentLevel = 1;
  gameOver = false;
  fireParticles = [];
  particles = [];
  isPaused = false;
  gameStartTime = Date.now();
  
  // Set kecepatan awal yang lebih cepat
  trashList.forEach(trash => {
    trash.speed = 2; // Kecepatan awal sampah
  });
  
  updateBackground(currentLevel);
  
  // Gunakan requestAnimationFrame dengan timestamp
  lastTime = 0;
  requestAnimationFrame(gameLoop);
}

// Tambahkan class Particle
class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = Math.random() * 5 + 2;
    this.speedX = (Math.random() - 0.5) * 4;
    this.speedY = (Math.random() - 0.5) * 4;
    this.color = '#4CAF50';
    this.life = 1;
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.life -= 0.02;
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = this.life;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// Tambahkan class FireParticle setelah class Particle yang ada
class FireParticle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = Math.random() * 3 + 2;
    this.speedY = -Math.random() * 2 - 1;
    this.speedX = (Math.random() - 0.5) * 1;
    this.life = 1;
    this.hue = Math.random() * 30 + 15; // Warna api antara kuning dan oranye
  }

  update() {
    this.y += this.speedY;
    this.x += this.speedX;
    this.life -= 0.02;
    this.size -= 0.1;
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = this.life;
    ctx.fillStyle = `hsl(${this.hue}, 100%, 50%)`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, Math.max(0, this.size), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// Tambahkan fungsi untuk membuat partikel
function createParticles(x, y) {
  for (let i = 0; i < 10; i++) {
    particles.push(new Particle(x, y));
  }
}

// Tambahkan fungsi untuk membuat efek api
function createFireEffect() {
  const particleCount = 3;
  for (let i = 0; i < particleCount; i++) {
    fireParticles.push(
      new FireParticle(
        player.x + player.width / 2,
        player.y + player.height - 5
      )
    );
  }
}

// Tambahkan fungsi untuk menangani pause
function togglePause() {
  isPaused = !isPaused;
  
  if (isPaused) {
    // Tampilkan layar pause segera
    renderPauseScreen();
  }
}

// Tambahkan fungsi baru untuk render layar pause
function renderPauseScreen() {
  if (isPaused) {
    ctx.save();
    // Overlay semi-transparan
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Teks PAUSE
    ctx.fillStyle = 'white';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSE', canvas.width / 2, canvas.height / 2);
    
    // Teks instruksi
    ctx.font = '24px Arial';
    ctx.fillText('Tekan SPASI untuk melanjutkan', canvas.width / 2, canvas.height / 2 + 50);
    ctx.restore();
  }
}

// Modifikasi class PowerUp
class PowerUp {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 30;
    this.speed = 0.3; // Kecepatan power-up yang lebih lambat
    this.type = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
  }
}

// Tambahkan fungsi untuk generate power-ups
function generatePowerUp() {
  if (Math.random() < 0.01) {
    powerUps.push(new PowerUp(
      Math.random() * (canvas.width - 30),
      0
    ));
  }
}

// Tambahkan fungsi checkCollision setelah fungsi movePlayer
function checkCollision(obj1, obj2) {
  return (
    obj1.x < obj2.x + obj2.width &&
    obj1.x + obj1.width > obj2.x &&
    obj1.y < obj2.y + obj2.height &&
    obj1.y + obj1.height > obj2.y
  );
}

// Modifikasi game loop untuk mengontrol FPS
function gameLoop(timestamp) {
  if (gameOver) return;
  
  // Hitung delta time
  const deltaTime = timestamp - lastTime;
  
  if (deltaTime >= frameTime) {
    lastTime = timestamp;
    
    if (!isPaused) {
      movePlayer();
      updateGame(deltaTime / 1000); // Konversi ke detik
    }
  }
  
  requestAnimationFrame(gameLoop);
}

// Modifikasi fungsi updateGame
function updateGame(deltaTime) {
  if (gameOver || isPaused) return;
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Display score and level (pindahkan ke sini agar selalu tampil)
  ctx.fillStyle = 'white';
  ctx.font = '20px Arial';
  ctx.fillText(`Score: ${score}`, 10, 30);
  ctx.fillText(`Level: ${currentLevel}`, 150, 30);

  // Jika game di-pause, render layar pause dan return
  if (isPaused) {
    // Draw player
    ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
    
    // Draw existing objects
    trashList.forEach(trash => {
      ctx.drawImage(
        trashTypes[trash.type].image,
        trash.x,
        trash.y,
        trash.width,
        trash.height
      );
    });
    
    obstacles.forEach(obstacle => {
      ctx.drawImage(obstacleImg, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    });
    
    // Render pause screen
    renderPauseScreen();
    return;
  }

  // Check for level up
  const nextLevelScore = currentLevel * 100;
  if (score >= nextLevelScore && currentLevel < MAX_LEVEL) {
    currentLevel++;
    showLevelUpNotification();
    levelUpSound.play();
    adjustDifficulty(currentLevel);
    increasePlayerSize();
  }

  // Check for win condition (sesuaikan dengan level 7)
  if (currentLevel === MAX_LEVEL && score >= 700) { // Diubah menjadi 700 untuk level 7
    winGame();
    return;
  }

  // Update dan render efek api
  fireParticles = fireParticles.filter(particle => particle.life > 0 && particle.size > 0);
  fireParticles.forEach(particle => {
    particle.update();
    particle.draw();
  });

  // Tambahkan partikel api baru
  createFireEffect();

  // Draw player
  ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);

  // Draw and move trash
  trashList.forEach((trash, index) => {
    // Draw trash dengan gambar yang sesuai
    ctx.drawImage(
      trashTypes[trash.type].image,
      trash.x,
      trash.y,
      trash.width,
      trash.height
    );
    
    trash.y += trash.speed * deltaTime * 60; // Normalisasi dengan 60 FPS

    // Check collision with trash
    if (checkCollision(player, trash)) {
      collectSound.play();
      // Tambah skor sesuai jenis sampah
      score += trashTypes[trash.type].points;
      
      // Tampilkan informasi sampah
      showTrashInfo(trash.type);
      
      createParticles(trash.x + trash.width/2, trash.y + trash.height/2);
      trashList[index] = createNewTrash();
    }

    // Remove off-screen trash
    if (trash.y > canvas.height) {
      trashList[index] = createNewTrash();
    }
  });

  // Tambahkan update dan render partikel
  particles = particles.filter(particle => particle.life > 0);
  particles.forEach(particle => {
    particle.update();
    particle.draw();
  });

  // Generate obstacles dengan jumlah yang meningkat per level
  if (Math.random() < 0.003 + (currentLevel * 0.001)) {
    if (obstacles.length < currentLevel + 2) { // Tambah maksimal obstacle
      obstacles.push({ 
        x: Math.random() * (canvas.width - 50),
        y: -50,
        width: 50,
        height: 50,
        speed: 2 + (currentLevel * 0.4) // Sesuaikan dengan adjustDifficulty
      });
    }
  }

  // Draw and move obstacles
  obstacles.forEach((obstacle, index) => {
    ctx.drawImage(obstacleImg, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    obstacle.y += obstacle.speed * deltaTime * 60; // Normalisasi dengan 60 FPS

    // Check collision with obstacles
    if (
      player.x < obstacle.x + obstacle.width &&
      player.x + player.width > obstacle.x &&
      player.y < obstacle.y + obstacle.height &&
      player.y + player.height > obstacle.y
    ) {
      crashSound.play();
      gameOver = true;
      showGameOverScreen();
    }

    // Remove off-screen obstacles
    if (obstacle.y > canvas.height) {
      obstacles.splice(index, 1);
    }
  });

  // Update dan render power-ups
  for (let i = powerUps.length - 1; i >= 0; i--) {
    const powerUp = powerUps[i];
    
    // Render power-up dengan warna berbeda
    switch(powerUp.type) {
      case 'shield':
        ctx.fillStyle = 'rgba(0, 100, 255, 0.8)';
        break;
      case 'speedBoost':
        ctx.fillStyle = 'rgba(255, 255, 0, 0.8)';
        break;
      case 'magnet':
        ctx.fillStyle = 'rgba(255, 0, 255, 0.8)';
        break;
      case 'timeSlower':
        ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
        break;
    }
    
    // Render power-up
    ctx.beginPath();
    ctx.arc(powerUp.x + 15, powerUp.y + 15, 15, 0, Math.PI * 2);
    ctx.fill();
    
    // Tambahkan efek berkilau
    ctx.save();
    ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.01) * 0.2;
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
    
    powerUp.y += powerUp.speed * deltaTime * 60; // Normalisasi dengan 60 FPS
    
    // Collision dengan player
    if (checkCollision(player, powerUp)) {
      // Mainkan suara power-up
      const powerUpSound = new Audio('assets/sounds/powerup.mp3');
      powerUpSound.volume = 0.5; // Set volume ke 50%
      powerUpSound.play().catch(err => console.log('Error playing sound:', err));
      
      // Terapkan power-up
      applyPowerUp(powerUp.type);
      
      // Hapus power-up
      powerUps.splice(i, 1);
      continue;
    }
    
    // Hapus power-up yang keluar layar
    if (powerUp.y > canvas.height) {
      powerUps.splice(i, 1);
    }
  }

  // Generate power-ups dengan probabilitas yang lebih rendah
  if (Math.random() < 0.0005 + (currentLevel * 0.0001)) {
    if (powerUps.length < 2) {
      powerUps.push(new PowerUp(
        Math.random() * (canvas.width - 30),
        -30
      ));
    }
  }

  // Tambahkan sistem achievement
  checkAchievements();

  // Render status power-up aktif
  if (player.hasShield) {
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(0, 100, 255, 0.5)';
    ctx.lineWidth = 3;
    ctx.arc(player.x + player.width/2, player.y + player.height/2, 
            player.width * 0.7, 0, Math.PI * 2);
    ctx.stroke();
  }
  
  if (player.hasSpeedBoost) {
    // Efek trail untuk speed boost
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 255, 0, 0.3)';
    ctx.lineWidth = 2;
    ctx.moveTo(player.x, player.y + player.height);
    ctx.lineTo(player.x + player.width/2, player.y + player.height + 20);
    ctx.lineTo(player.x + player.width, player.y + player.height);
    ctx.stroke();
  }
  
  if (player.hasMagnet) {
    // Efek lingkaran magnet
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 0, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.arc(player.x + player.width/2, player.y + player.height/2, 
            player.width * 2, 0, Math.PI * 2);
    ctx.stroke();
  }
  
  if (player.hasTimeSlow) {
    // Efek slow motion
    ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  requestAnimationFrame(gameLoop);
}

// Modifikasi fungsi updateBackground
function updateBackground(level) {
  // Pastikan level dalam rentang yang valid
  if (level < 1) level = 1;
  if (level > MAX_LEVEL) level = MAX_LEVEL;
  
  // Pastikan gambar sudah dimuat
  if (backgroundImages[level].complete) {
    canvas.style.backgroundImage = `url('${backgroundImages[level].src}')`;
  } else {
    // Jika gambar belum dimuat, tambahkan event listener
    backgroundImages[level].onload = () => {
      canvas.style.backgroundImage = `url('${backgroundImages[level].src}')`;
    };
  }
  
  // Tambahkan efek transisi halus
  canvas.style.transition = 'background-image 0.5s ease-in-out';
}

// Modifikasi fungsi showLevelUpNotification
function showLevelUpNotification() {
  const notification = document.getElementById('level-up-notification');
  document.getElementById('current-level').textContent = currentLevel;
  notification.classList.remove('hidden');
  
  // Update background dengan efek transisi
  updateBackground(currentLevel);
  
  // Mainkan suara level up
  levelUpSound.play().catch(err => console.log('Error playing level up sound:', err));
  
  // Sembunyikan notifikasi setelah 2 detik
  setTimeout(() => {
    notification.classList.add('hidden');
  }, 2000);
}

// Modifikasi fungsi adjustDifficulty
function adjustDifficulty(level) {
  // Kecepatan sampah meningkat
  trashList.forEach(trash => {
    trash.speed = 2 + (level * 0.3); // Kecepatan dasar 2, naik 0.3 per level
  });

  // Kecepatan obstacle meningkat lebih signifikan
  obstacles.forEach(obstacle => {
    obstacle.speed = 2 + (level * 0.4); // Kecepatan dasar 2, naik 0.4 per level
  });

  // Update background sesuai level
  updateBackground(level);
}

// Increase player size
function increasePlayerSize() {
  player.width += 10; // Increase width
  player.height += 10; // Increase height
}

// Handle player movement
const keys = {};
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault(); // Mencegah scroll halaman
    if (!gameOver) {
      togglePause();
    }
    return;
  }
  
  // Hanya proses input jika game tidak di-pause
  if (!isPaused && !gameOver) {
    keys[e.key] = true;
  }
});

document.addEventListener('keyup', (e) => {
  keys[e.key] = false;
});

function movePlayer() {
  if (keys['ArrowUp'] || keys['w']) player.y = Math.max(player.y - player.speed, 0);
  if (keys['ArrowDown'] || keys['s']) player.y = Math.min(player.y + player.speed, canvas.height - player.height);
  if (keys['ArrowLeft'] || keys['a']) player.x = Math.max(player.x - player.speed, 0);
  if (keys['ArrowRight'] || keys['d']) player.x = Math.min(player.x + player.speed, canvas.width - player.width);
}

// Show game over screen
function showGameOverScreen() {
  gameIntervals.forEach(interval => clearInterval(interval));
  gameIntervals = [];
  
  document.getElementById('final-score').textContent = score;
  document.getElementById('game-over-screen').classList.remove('hidden');
  document.getElementById('gameCanvas').classList.add('hidden');
  
  stopMusic(gameMusic); // Hentikan musik game
  
  saveHighScore(score);
  
  const highScoresList = document.getElementById('high-scores-list');
  highScoresList.innerHTML = '';
  
  highScores.forEach((scoreData, index) => {
    const li = document.createElement('li');
    li.textContent = `${index + 1}. ${scoreData.score} poin (${scoreData.date})`;
    highScoresList.appendChild(li);
  });
}

// Show win screen
function winGame() {
  // Bersihkan semua interval
  gameIntervals.forEach(interval => clearInterval(interval));
  gameIntervals = [];
  
  // Set gameOver ke true agar gameLoop berhenti
  gameOver = true;
  
  winSound.play();
  document.getElementById('win-screen').classList.remove('hidden');
  document.getElementById('gameCanvas').classList.add('hidden');
}

// Event listeners for buttons
document.getElementById('start-game').addEventListener('click', () => {
  document.getElementById('main-menu').classList.add('hidden');
  document.getElementById('gameCanvas').classList.remove('hidden');
  // Mulai musik dengan interaksi user
  gameMusic.play().then(() => {
    isMusicPlaying = true;
    document.querySelector('.music-icon').textContent = '🔊';
  }).catch(error => {
    console.log("Error starting music:", error);
  });
  initGame();
  gameLoop();
});

document.getElementById('about-game').addEventListener('click', () => {
  document.getElementById('main-menu').classList.add('hidden');
  document.getElementById('about-screen').classList.remove('hidden');
});

document.getElementById('back-to-menu').addEventListener('click', () => {
  document.getElementById('about-screen').classList.add('hidden');
  document.getElementById('main-menu').classList.remove('hidden');
});

document.getElementById('back-to-menu-gameover').addEventListener('click', () => {
  document.getElementById('game-over-screen').classList.add('hidden');
  document.getElementById('main-menu').classList.remove('hidden');
  gameOver = true;
  score = 0;
});

document.getElementById('restart-game').addEventListener('click', () => {
  document.getElementById('game-over-screen').classList.add('hidden');
  document.getElementById('gameCanvas').classList.remove('hidden');
  initGame();
  gameLoop();
});

document.getElementById('restart-game-win').addEventListener('click', () => {
  document.getElementById('win-screen').classList.add('hidden');
  document.getElementById('gameCanvas').classList.remove('hidden');
  initGame();
  gameLoop();
});

function checkAchievements() {
  const gameTime = (Date.now() - gameStartTime) / 1000; // Waktu dalam detik
  
  // Check Trash Collector
  if (!achievements.trashCollector.completed && score >= 500) {
    unlockAchievement('trashCollector');
  }
  
  // Check Speed Runner
  if (!achievements.speedRunner.completed && currentLevel >= 3 && gameTime <= 60) {
    unlockAchievement('speedRunner');
  }
  
  // Check Environmentalist
  if (!achievements.environmentalist.completed && score >= 1000) {
    unlockAchievement('environmentalist');
  }
  
  // Check Survivor
  if (!achievements.survivor.completed && gameTime >= 180) {
    unlockAchievement('survivor');
  }
}

function unlockAchievement(id) {
  achievements[id].completed = true;
  
  // Tampilkan notifikasi
  showAchievement(id);
  
  // Update achievement list di game over screen
  const achievementsList = document.getElementById('achievements-list');
  // Bersihkan list sebelum menambahkan yang baru
  achievementsList.innerHTML = '';
  
  // Ambil hanya 3 achievement terakhir
  const recentAchievements = Object.entries(achievements)
    .filter(([_, ach]) => ach.completed)
    .slice(-3);
  
  recentAchievements.forEach(([id, ach]) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <strong>${ach.name}</strong>
      <p>${ach.description}</p>
    `;
    achievementsList.appendChild(li);
  });
  
  // Simpan achievement ke localStorage
  localStorage.setItem('achievements', JSON.stringify(achievements));
}

function showAchievement(name) {
  const notification = document.createElement('div');
  notification.className = 'achievement-notification';
  notification.innerHTML = `
    <h3>Achievement Unlocked!</h3>
    <p>${achievements[name].name}</p>
  `;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
}

function saveHighScore(score) {
  highScores.push({
    score: score,
    date: new Date().toLocaleDateString()
  });
  highScores.sort((a, b) => b.score - a.score);
  highScores = highScores.slice(0, 3); // Simpan 3 skor tertinggi
  localStorage.setItem('highScores', JSON.stringify(highScores));
}

// Load high scores saat game dimulai
function loadHighScores() {
  const savedScores = localStorage.getItem('highScores');
  if (savedScores) {
    highScores = JSON.parse(savedScores);
  }
}

// Modifikasi fungsi untuk membuat sampah baru
function createNewTrash() {
  const types = Object.keys(trashTypes);
  const randomType = types[Math.floor(Math.random() * types.length)];
  
  return {
    x: Math.random() * (canvas.width - 50),
    y: -50,
    width: 50,
    height: 50,
    speed: 2, // Ubah kecepatan awal dari 0.5 menjadi 2
    type: randomType
  };
}

// Modifikasi fungsi showTrashInfo untuk durasi yang lebih cepat
function showTrashInfo(trashType) {
  const info = trashTypes[trashType];
  
  // Hapus notifikasi lama jika ada
  const existingNotification = document.querySelector('.trash-notification');
  if (existingNotification) {
    existingNotification.remove();
  }
  
  const notification = document.createElement('div');
  notification.className = 'trash-notification';
  notification.innerHTML = `
    <h4>${info.name}</h4>
    <p>Waktu penguraian: ${info.decompositionTime}</p>
    <p class="recycling-tip">Tips: ${info.recyclingTip}</p>
  `;
  
  // Posisikan notifikasi di pojok kanan atas
  notification.style.position = 'fixed';
  notification.style.top = '10px';
  notification.style.right = '10px';
  notification.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  notification.style.color = 'white';
  notification.style.padding = '15px';
  notification.style.borderRadius = '8px';
  notification.style.zIndex = '1000';
  notification.style.maxWidth = '300px';
  notification.style.opacity = '1';
  
  document.body.appendChild(notification);
  
  // Hapus notifikasi setelah 1.5 detik
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => notification.remove(), 300); // Transisi fade out 300ms
  }, 1500); // Durasi tampil 1.5 detik
}

// Fungsi untuk toggle musik
function toggleMusic() {
  if (isMusicPlaying) {
    stopMusic(gameMusic);
    document.querySelector('.music-icon').textContent = '🔈';
  } else {
    gameMusic.play().then(() => {
      isMusicPlaying = true;
      document.querySelector('.music-icon').textContent = '🔊';
    }).catch(error => {
      console.log("Error toggling music:", error);
    });
  }
}

// Event listener untuk tombol musik
document.getElementById('music-toggle').addEventListener('click', toggleMusic);

// Event listener untuk tombol M
document.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'm') {
    toggleMusic();
  }
});

// Tambahkan event listener untuk tombol panduan
document.getElementById('game-guide').addEventListener('click', () => {
  document.getElementById('main-menu').classList.add('hidden');
  document.getElementById('game-guide-screen').classList.remove('hidden');
});

document.getElementById('back-from-guide').addEventListener('click', () => {
  document.getElementById('game-guide-screen').classList.add('hidden');
  document.getElementById('main-menu').classList.remove('hidden');
});

// Modifikasi fungsi applyPowerUp
function applyPowerUp(type) {
  // Tampilkan notifikasi power-up
  showPowerUpNotification(type);
  
  // Mainkan suara power-up
  const powerUpSound = new Audio('assets/sounds/powerup.mp3');
  powerUpSound.volume = 0.5;
  powerUpSound.play().catch(err => console.log('Error playing sound:', err));
  
  // Tambahkan efek visual
  createSpecialEffect('powerUp', player.x + player.width/2, player.y + player.height/2);
  
  switch(type) {
    case 'shield':
      player.hasShield = true;
      // Tambahkan visual shield
      const shieldEffect = document.createElement('div');
      shieldEffect.className = 'shield-effect';
      document.body.appendChild(shieldEffect);
      
      setTimeout(() => {
        player.hasShield = false;
        shieldEffect.remove();
      }, 5000);
      break;
      
    case 'speedBoost':
      player.speed *= 1.5;
      // Tambahkan visual speed
      player.hasSpeedBoost = true;
      setTimeout(() => {
        player.speed /= 1.5;
        player.hasSpeedBoost = false;
      }, 3000);
      break;
      
    case 'magnet':
      player.hasMagnet = true;
      const magnetDuration = 5000;
      const magnetInterval = setInterval(() => {
        trashList.forEach(trash => {
          const dx = player.x - trash.x;
          const dy = player.y - trash.y;
          trash.x += dx * 0.03;
          trash.y += dy * 0.03;
        });
      }, 16);
      
      setTimeout(() => {
        clearInterval(magnetInterval);
        player.hasMagnet = false;
      }, magnetDuration);
      break;
      
    case 'timeSlower':
      player.hasTimeSlow = true;
      const oldSpeeds = obstacles.map(o => o.speed);
      obstacles.forEach(o => o.speed *= 0.5);
      trashList.forEach(t => t.speed *= 0.5);
      
      setTimeout(() => {
        obstacles.forEach((o, i) => o.speed = oldSpeeds[i]);
        trashList.forEach(t => t.speed *= 2);
        player.hasTimeSlow = false;
      }, 4000);
      break;
  }
}

// Tambahkan fungsi untuk menampilkan notifikasi power-up
function showPowerUpNotification(type) {
  const notification = document.createElement('div');
  notification.className = 'power-up-notification';
  
  let icon, message;
  switch(type) {
    case 'shield':
      icon = '🛡️';
      message = 'Shield Aktif! (5 detik)';
      break;
    case 'speedBoost':
      icon = '⚡';
      message = 'Speed Boost! (3 detik)';
      break;
    case 'magnet':
      icon = '🧲';
      message = 'Magnet Aktif! (5 detik)';
      break;
    case 'timeSlower':
      icon = '⏰';
      message = 'Time Slower! (4 detik)';
      break;
  }
  
  notification.innerHTML = `
    <div class="power-up-icon">${icon}</div>
    <div class="power-up-message">${message}</div>
  `;
  
  document.body.appendChild(notification);
  
  // Hapus notifikasi setelah 3 detik
  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => notification.remove(), 500);
  }, 3000);
}

// Modifikasi fungsi createSpecialEffect
function createSpecialEffect(type, x, y) {
  const effect = document.createElement('div');
  effect.className = `special-effect ${type}`;
  effect.style.left = `${x - 25}px`;
  effect.style.top = `${y - 25}px`;
  document.body.appendChild(effect);
  
  setTimeout(() => {
    effect.remove();
  }, 1000);
}

// Tambahkan fungsi untuk membuat leaf particles
function createLeaves() {
  const mainMenu = document.getElementById('main-menu');
  for (let i = 0; i < 10; i++) {
    const leaf = document.createElement('div');
    leaf.className = 'leaf';
    leaf.style.left = Math.random() * 100 + '%';
    leaf.style.animationDelay = Math.random() * 5 + 's';
    mainMenu.appendChild(leaf);
  }
}

// Panggil fungsi saat menu dimuat
document.addEventListener('DOMContentLoaded', createLeaves);