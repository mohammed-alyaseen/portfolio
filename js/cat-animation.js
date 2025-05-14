class Cat {
  constructor(canvas, x, y, scale = 1, color = 'default') {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.x = x;
    this.y = y;
    this.scale = scale;
    this.color = color;
    this.direction = 1;
    this.speed = 2;
    this.frame = 0;
    this.frameCount = 8;
    this.frameWidth = 64;
    this.frameHeight = 64;
    this.isPaused = false;
    this.pauseTimer = 0;
    this.pauseDuration = 0;
    this.pawPrints = [];
    this.lastPawPrint = 0;
    this.lastMeow = 0;
    this.meowCooldown = 3000; // 3 seconds between meows
    
    // Initialize sounds with error handling
    this.sounds = {
      meow: null,
      purr: null,
      paw: null
    };

    // Create audio elements with error handling
    try {
      this.sounds.meow = new Audio('sounds/meow.wav');
      this.sounds.paw = new Audio('sounds/paw.wav');

      // Set volume for each sound
      this.sounds.meow.volume = 0.4;
      this.sounds.purr.volume = 0.3;
      this.sounds.paw.volume = 0.2;

      // Add error handling for each sound
      Object.entries(this.sounds).forEach(([key, sound]) => {
        if (sound) {
          sound.addEventListener('error', (e) => {
            console.warn(`Error loading ${key} sound:`, e);
          });
        }
      });
    } catch (error) {
      console.warn('Error initializing sounds:', error);
    }
  }

  playSound(soundName) {
    try {
      const sound = this.sounds[soundName];
      if (sound) {
        sound.currentTime = 0;
        sound.play().catch(error => {
          console.warn(`Error playing ${soundName} sound:`, error);
        });
      }
    } catch (error) {
      console.warn(`Error playing ${soundName} sound:`, error);
    }
  }

  update() {
    if (this.isPaused) {
      this.pauseTimer++;
      if (this.pauseTimer >= this.pauseDuration) {
        this.isPaused = false;
        this.pauseTimer = 0;
      }
      return;
    }

    // Random pause and meow
    if (Math.random() < 0.005) {
      this.isPaused = true;
      this.pauseDuration = Math.random() * 100 + 100;
      
      // Random meow during pause
      if (Date.now() - this.lastMeow > this.meowCooldown) {
        this.playSound('meow');
        this.lastMeow = Date.now();
      }
    }

    // Update position
    this.x += this.speed * this.direction;
    
    // Change direction at edges
    if (this.x >= this.canvas.width - this.frameWidth * this.scale) {
      this.direction = -1;
      this.playSound('paw');
    } else if (this.x <= 0) {
      this.direction = 1;
      this.playSound('paw');
    }

    // Update animation frame
    this.frame = (this.frame + 0.2) % this.frameCount;

    // Add paw prints with sound
    if (Date.now() - this.lastPawPrint > 200) {
      this.addPawPrint();
      this.lastPawPrint = Date.now();
      // Play paw sound occasionally
      if (Math.random() < 0.3) {
        this.playSound('paw');
      }
    }

    // Update paw prints
    this.pawPrints = this.pawPrints.filter(print => {
      print.opacity -= 0.02;
      return print.opacity > 0;
    });
  }

  draw() {
    // Draw paw prints
    this.pawPrints.forEach(print => {
      this.ctx.globalAlpha = print.opacity;
      this.ctx.fillStyle = '#000';
      this.ctx.beginPath();
      this.ctx.arc(print.x, print.y, 3, 0, Math.PI * 2);
      this.ctx.fill();
    });
    this.ctx.globalAlpha = 1;

    // Draw cat
    this.ctx.save();
    this.ctx.translate(this.x, this.y);
    this.ctx.scale(this.direction * this.scale, this.scale);
    
    // Draw cat body
    this.ctx.fillStyle = this.color === 'default' ? '#666' : 
                        this.color === 'orange' ? '#FFA500' : '#000';
    
    // Body
    this.ctx.beginPath();
    this.ctx.ellipse(32, 40, 20, 15, 0, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Head
    this.ctx.beginPath();
    this.ctx.arc(15, 35, 12, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Ears
    this.ctx.beginPath();
    this.ctx.moveTo(8, 28);
    this.ctx.lineTo(5, 20);
    this.ctx.lineTo(12, 28);
    this.ctx.fill();
    
    this.ctx.beginPath();
    this.ctx.moveTo(22, 28);
    this.ctx.lineTo(25, 20);
    this.ctx.lineTo(18, 28);
    this.ctx.fill();
    
    // Tail
    this.ctx.beginPath();
    this.ctx.moveTo(52, 40);
    this.ctx.quadraticCurveTo(60, 30, 65, 40);
    this.ctx.strokeStyle = this.ctx.fillStyle;
    this.ctx.lineWidth = 4;
    this.ctx.stroke();
    
    // Legs (animated)
    const legOffset = Math.sin(this.frame * 0.5) * 5;
    this.ctx.beginPath();
    this.ctx.moveTo(25, 55);
    this.ctx.lineTo(25, 55 + legOffset);
    this.ctx.moveTo(35, 55);
    this.ctx.lineTo(35, 55 - legOffset);
    this.ctx.moveTo(45, 55);
    this.ctx.lineTo(45, 55 + legOffset);
    this.ctx.strokeStyle = this.ctx.fillStyle;
    this.ctx.lineWidth = 3;
    this.ctx.stroke();
    
    this.ctx.restore();
  }

  addPawPrint() {
    const offset = this.direction === 1 ? 20 : -20;
    this.pawPrints.push({
      x: this.x + offset,
      y: this.y + this.frameHeight * this.scale - 5,
      opacity: 0.5
    });
  }

  isPointInside(x, y) {
    return x >= this.x && 
           x <= this.x + this.frameWidth * this.scale &&
           y >= this.y && 
           y <= this.y + this.frameHeight * this.scale;
  }

  interact(x, y) {
    if (this.isPointInside(x, y)) {
      this.isPaused = true;
      this.pauseDuration = 100;
      
      // Play purr sound when petted
      this.playSound('purr');
      
      // Occasionally meow when petted
      if (Math.random() < 0.3 && Date.now() - this.lastMeow > this.meowCooldown) {
        this.playSound('meow');
        this.lastMeow = Date.now();
      }
      
      return true;
    }
    return false;
  }
}

// Initialize cat animation
document.addEventListener('DOMContentLoaded', function() {
  const container = document.createElement('div');
  container.id = 'cat-container';
  container.style.cssText = `
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 100px;
    pointer-events: none;
    z-index: 9999;
  `;
  document.body.appendChild(container);

  const canvas = document.createElement('canvas');
  canvas.width = window.innerWidth;
  canvas.height = 100;
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  const cats = [
    new Cat(canvas, 0, 20, 1, 'default'),
    new Cat(canvas, 200, 10, 0.8, 'orange'),
    new Cat(canvas, 400, 30, 1.2, 'black')
  ];

  // Handle window resize
  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
  });

  // Handle mouse interaction
  canvas.style.pointerEvents = 'auto';
  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    cats.forEach(cat => {
      cat.interact(x, y);
    });
  });

  // Animation loop
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    cats.forEach(cat => {
      cat.update();
      cat.draw();
    });
    
    requestAnimationFrame(animate);
  }

  animate();
});
