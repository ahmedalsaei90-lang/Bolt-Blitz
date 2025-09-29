'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { LightningLogo } from '@/components/ui/lightning-logo';
import Phaser from 'phaser';

export default function SplashScreen() {
  const gameRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!gameRef.current) return;

    // Set CSS space gradient background
    document.body.style.background = 'radial-gradient(ellipse at top, rgba(128, 0, 128, 0.4) 0%, transparent 50%), radial-gradient(ellipse at bottom left, rgba(0, 0, 255, 0.4) 0%, transparent 50%), radial-gradient(ellipse at bottom right, rgba(75, 0, 130, 0.3) 0%, transparent 50%), radial-gradient(ellipse at center, #000000 0%, #0a0a0a 100%)';
    document.body.style.margin = '0';
    document.body.style.overflow = 'hidden';

    // Enhanced Phaser config for ultra-high performance and visual quality
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.WEBGL,
      width: window.innerWidth,
      height: window.innerHeight,
      parent: gameRef.current,
      transparent: true,
      physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 0 } } },
      scale: { 
        mode: Phaser.Scale.RESIZE, 
        autoCenter: Phaser.Scale.CENTER_BOTH,
        fullscreenTarget: gameRef.current
      },
      fps: { target: 120, forceSetTimeOut: true },
      render: { 
        antialias: true, 
        antialiasGL: true,
        pixelArt: false,
        roundPixels: false,
        transparent: true,
        clearBeforeRender: true,
        preserveDrawingBuffer: false,
        failIfMajorPerformanceCaveat: false,
        powerPreference: 'high-performance'
      },
      scene: { preload, create, update },
    };

    const game = new Phaser.Game(config);
    phaserGameRef.current = game;

    // Enhanced game variables
    let starField: Phaser.GameObjects.Graphics;
    let nebulaClouds: Phaser.GameObjects.Graphics[] = [];
    let planetRings: Phaser.GameObjects.Graphics[] = [];
    let cosmicDust: Phaser.GameObjects.Particles.ParticleEmitter[] = [];
    let energyOrbs: Phaser.GameObjects.Graphics[] = [];
    let logo: Phaser.GameObjects.Graphics;
    let logoGlow: Phaser.GameObjects.Graphics;
    let appName: Phaser.GameObjects.Text;
    let tagline: Phaser.GameObjects.Text;
    let progressContainer: Phaser.GameObjects.Graphics;
    let progressBar: Phaser.GameObjects.Graphics;
    let progressFill: Phaser.GameObjects.Graphics;
    let progressGlow: Phaser.GameObjects.Graphics;
    let loadingText: Phaser.GameObjects.Text;
    let cosmicLightning: Phaser.GameObjects.Graphics[] = [];
    let warpLines: Phaser.GameObjects.Graphics[] = [];
    let loadingProgress = 0;
    let startTime = Date.now();
    let animationTime = 0;

    function preload(this: Phaser.Scene) {
      // Create particle texture programmatically for better performance
      this.add.graphics()
        .fillStyle(0xffffff)
        .fillCircle(16, 16, 16)
        .generateTexture('particle', 32, 32);
      
      // Create energy orb texture
      this.add.graphics()
        .fillGradientStyle(0x00ffff, 0x0080ff, 0xff00ff, 0x8000ff)
        .fillCircle(8, 8, 8)
        .generateTexture('energy-orb', 16, 16);
    }

    function create(this: Phaser.Scene) {
      try {
        const { width, height } = this.cameras.main;
        const centerX = width / 2;
        const centerY = height / 2;

        // Create animated star field with depth layers
        createStarField(this, width, height);
        
        // Create nebula clouds with animated colors
        createNebulaClouds(this, width, height);
        
        // Create planetary rings in background
        createPlanetaryRings(this, width, height);
        
        // Create cosmic dust particles
        createCosmicDust(this, width, height);
        
        // Create floating energy orbs
        createEnergyOrbs(this, width, height);
        
        // Create warp speed lines
        createWarpLines(this, width, height);

        // Enhanced 3D lightning bolt logo with multiple layers
        createLightningLogo(this, centerX, centerY - 80);
        
        // Futuristic app name with holographic effect
        createHolographicTitle(this, centerX, centerY + 40);
        
        // Animated tagline with typewriter effect
        createAnimatedTagline(this, centerX, centerY + 100);
        
        // Ultra-modern progress bar with energy effects
        createEnergyProgressBar(this, width, height);
        
        // Cosmic lightning effects
        createCosmicLightning(this, width, height);

        // Enhanced resize handler
        this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
          const { width: newWidth, height: newHeight } = gameSize;
          updateLayout(this, newWidth, newHeight);
        });

        // Simulate enhanced loading with visual feedback
        const loadTimer = this.time.addEvent({
          delay: 80,
          callback: () => {
            loadingProgress = Math.min(loadingProgress + Math.random() * 3, 100);
            updateProgress(this, loadingProgress);
            
            if (loadingProgress >= 100 && Date.now() - startTime > 4000) {
              loadTimer.destroy();
              
              // Epic transition sequence
              this.cameras.main.fadeOut(800, 0, 0, 0, (camera: Phaser.Cameras.Scene2D.Camera, progress: number) => {
                if (progress === 1) router.push('/main');
              });
            }
          },
          repeat: 125,
        });

      } catch (error) {
        console.error('Phaser create error:', error);
        router.push('/main');
      }
    }

    function update(this: Phaser.Scene, time: number) {
      animationTime = time;
      
      // Animate star field twinkling
      if (starField) {
        starField.setAlpha(0.8 + Math.sin(time * 0.001) * 0.2);
      }
      
      // Animate nebula clouds
      nebulaClouds.forEach((cloud, index) => {
        cloud.setAlpha(0.3 + Math.sin(time * 0.002 + index) * 0.2);
        cloud.setRotation(time * 0.0001 * (index + 1));
      });
      
      // Animate planetary rings
      planetRings.forEach((ring, index) => {
        ring.setRotation(time * 0.0005 * (index % 2 === 0 ? 1 : -1));
      });
      
      // Animate energy orbs
      energyOrbs.forEach((orb, index) => {
        const baseY = orb.getData('baseY');
        orb.setY(baseY + Math.sin(time * 0.003 + index) * 20);
        orb.setAlpha(0.7 + Math.sin(time * 0.004 + index) * 0.3);
      });
      
      // Animate logo glow
      if (logoGlow) {
        logoGlow.setAlpha(0.5 + Math.sin(time * 0.005) * 0.3);
        logoGlow.setScale(1 + Math.sin(time * 0.003) * 0.1);
      }
      
      // Animate warp lines
      warpLines.forEach((line, index) => {
        line.setAlpha(0.4 + Math.sin(time * 0.01 + index) * 0.4);
      });
    }

    function createStarField(scene: Phaser.Scene, width: number, height: number) {
      starField = scene.add.graphics();
      
      // Create multiple layers of stars with different sizes and colors
      const starColors = [0xffffff, 0x8888ff, 0xaa88ff, 0x6666ff];
      
      for (let layer = 0; layer < 3; layer++) {
        const starCount = 150 - layer * 30;
        const starSize = 3 - layer;
        
        for (let i = 0; i < starCount; i++) {
          const x = Math.random() * width;
          const y = Math.random() * height;
          const color = starColors[Math.floor(Math.random() * starColors.length)];
          const alpha = 0.3 + Math.random() * 0.7;
          
          starField.fillStyle(color, alpha);
          starField.fillCircle(x, y, starSize);
          
          // Add twinkling effect
          if (Math.random() < 0.1) {
            starField.fillStyle(color, 1);
            starField.fillCircle(x, y, starSize + 1);
          }
        }
      }
    }

    function createNebulaClouds(scene: Phaser.Scene, width: number, height: number) {
      const nebulaColors = [
        [0x4a0e4e, 0x81007f], // Purple nebula
        [0x0e0e4a, 0x00007f], // Blue nebula
        [0x2a0a4a, 0x4b0082], // Indigo nebula
      ];
      
      nebulaColors.forEach((colors, index) => {
        const cloud = scene.add.graphics();
        const centerX = (width / 4) * (index + 1);
        const centerY = height / 2 + (index % 2 === 0 ? -100 : 100);
        
        cloud.fillGradientStyle(colors[0], colors[1], colors[0], colors[1], 0.3);
        cloud.fillEllipse(centerX, centerY, 300 + index * 50, 200 + index * 30);
        
        nebulaClouds.push(cloud);
      });
    }

    function createPlanetaryRings(scene: Phaser.Scene, width: number, height: number) {
      for (let i = 0; i < 2; i++) {
        const ring = scene.add.graphics();
        const x = width * (0.2 + i * 0.6);
        const y = height * (0.3 + i * 0.4);
        
        ring.lineStyle(3, 0x666699, 0.4);
        ring.strokeEllipse(x, y, 150 + i * 50, 30 + i * 10);
        
        ring.lineStyle(2, 0x9999cc, 0.3);
        ring.strokeEllipse(x, y, 180 + i * 60, 40 + i * 15);
        
        planetRings.push(ring);
      }
    }

    function createCosmicDust(scene: Phaser.Scene, width: number, height: number) {
      const dustColors = [0x4a90e2, 0x7b68ee, 0xff6b9d, 0x50c878];
      
      dustColors.forEach((color, index) => {
        const emitter = scene.add.particles(0, 0, 'particle', {
          x: { min: 0, max: width },
          y: { min: 0, max: height },
          scale: { start: 0.05, end: 0.2 },
          speed: { min: 10, max: 30 },
          lifespan: { min: 4000, max: 8000 },
          quantity: 1,
          tint: color,
          alpha: { start: 0.6, end: 0 },
          blendMode: 'ADD',
          emitting: true,
          gravityY: -5,
          rotate: { min: 0, max: 360 },
        });
        
        cosmicDust.push(emitter);
      });
    }

    function createEnergyOrbs(scene: Phaser.Scene, width: number, height: number) {
      for (let i = 0; i < 8; i++) {
        const orb = scene.add.graphics();
        const x = Math.random() * width;
        const y = Math.random() * height;
        
        orb.setData('baseY', y);
        
        // Create glowing orb effect
        orb.fillGradientStyle(0x00ffff, 0x0080ff, 0xff00ff, 0x8000ff, 0.8);
        orb.fillCircle(x, y, 8);
        
        orb.lineStyle(2, 0x00ffff, 0.6);
        orb.strokeCircle(x, y, 12);
        
        energyOrbs.push(orb);
      }
    }

    function createWarpLines(scene: Phaser.Scene, width: number, height: number) {
      for (let i = 0; i < 20; i++) {
        const line = scene.add.graphics();
        const startX = Math.random() * width;
        const startY = Math.random() * height;
        const endX = startX + (Math.random() - 0.5) * 200;
        const endY = startY + (Math.random() - 0.5) * 200;
        
        line.lineStyle(1, 0x00aaff, 0.4);
        line.lineBetween(startX, startY, endX, endY);
        
        warpLines.push(line);
      }
    }

    function createLightningLogo(scene: Phaser.Scene, x: number, y: number) {
      // Create outer glow effect
      logoGlow = scene.add.graphics({ x, y });
      logoGlow.fillGradientStyle(0x00ffff, 0x0080ff, 0x8000ff, 0x000000, 0.9);
      logoGlow.beginPath();
      // Realistic lightning bolt with natural jagged pattern
      logoGlow.moveTo(-8, -90);
      logoGlow.lineTo(15, -75);
      logoGlow.lineTo(5, -60);
      logoGlow.lineTo(25, -45);
      logoGlow.lineTo(10, -30);
      logoGlow.lineTo(30, -15);
      logoGlow.lineTo(12, 0);
      logoGlow.lineTo(35, 15);
      logoGlow.lineTo(8, 30);
      logoGlow.lineTo(25, 45);
      logoGlow.lineTo(5, 60);
      logoGlow.lineTo(20, 75);
      logoGlow.lineTo(-5, 90);
      logoGlow.lineTo(-15, 75);
      logoGlow.lineTo(-8, 60);
      logoGlow.lineTo(-20, 45);
      logoGlow.lineTo(-12, 30);
      logoGlow.lineTo(-25, 15);
      logoGlow.lineTo(-10, 0);
      logoGlow.lineTo(-30, -15);
      logoGlow.lineTo(-15, -30);
      logoGlow.lineTo(-25, -45);
      logoGlow.lineTo(-12, -60);
      logoGlow.lineTo(-20, -75);
      logoGlow.lineTo(-8, -90);
      logoGlow.closePath();
      logoGlow.fillPath();
      
      // Main lightning logo with gradient
      logo = scene.add.graphics({ x, y });
      
      // Realistic lightning bolt with electric blue gradient
      logo.fillGradientStyle(0x00ffff, 0x0080ff, 0x4000ff, 0x000000, 1);
      logo.beginPath();
      // Natural lightning bolt shape with realistic branches
      logo.moveTo(-5, -80);
      logo.lineTo(12, -65);
      logo.lineTo(2, -50);
      logo.lineTo(20, -35);
      logo.lineTo(8, -20);
      logo.lineTo(25, -5);
      logo.lineTo(10, 10);
      logo.lineTo(30, 25);
      logo.lineTo(5, 40);
      logo.lineTo(18, 55);
      logo.lineTo(2, 70);
      logo.lineTo(15, 80);
      logo.lineTo(-2, 80);
      logo.lineTo(-12, 65);
      logo.lineTo(-5, 50);
      logo.lineTo(-18, 35);
      logo.lineTo(-10, 20);
      logo.lineTo(-22, 5);
      logo.lineTo(-8, -10);
      logo.lineTo(-25, -25);
      logo.lineTo(-12, -40);
      logo.lineTo(-20, -55);
      logo.lineTo(-8, -70);
      logo.lineTo(-15, -80);
      logo.lineTo(-5, -80);
      logo.closePath();
      logo.fillPath();
      
      // Add electric energy outlines
      logo.lineStyle(3, 0x00ffff, 0.9);
      logo.strokePath();
      logo.lineStyle(2, 0x0080ff, 0.8);
      logo.strokePath();
      logo.lineStyle(1, 0x4000ff, 0.7);
      logo.strokePath();
      
      // Add bright electric core
      logo.fillGradientStyle(0xffffff, 0x80ffff, 0x4080ff, 0x2040ff, 0.8);
      logo.beginPath();
      // Inner electric core - smaller and brighter
      logo.moveTo(-2, -70);
      logo.lineTo(8, -55);
      logo.lineTo(0, -40);
      logo.lineTo(15, -25);
      logo.lineTo(5, -10);
      logo.lineTo(20, 5);
      logo.lineTo(7, 20);
      logo.lineTo(22, 35);
      logo.lineTo(2, 50);
      logo.lineTo(12, 65);
      logo.lineTo(0, 70);
      logo.lineTo(-8, 55);
      logo.lineTo(-2, 40);
      logo.lineTo(-12, 25);
      logo.lineTo(-5, 10);
      logo.lineTo(-15, -5);
      logo.lineTo(-5, -20);
      logo.lineTo(-18, -35);
      logo.lineTo(-8, -50);
      logo.lineTo(-12, -65);
      logo.lineTo(-2, -70);
      logo.closePath();
      logo.fillPath();
      
      // Add electric sparks around the lightning
      for (let i = 0; i < 15; i++) {
        const sparkX = (Math.random() - 0.5) * 120;
        const sparkY = (Math.random() - 0.5) * 180;
        const sparkColors = [0x00ffff, 0x0080ff, 0x4000ff, 0x8000ff];
        const sparkColor = sparkColors[i % 4];
        const sparkSize = 1 + Math.random() * 3;
        
        logo.fillStyle(sparkColor, 0.8);
        logo.fillCircle(sparkX, sparkY, sparkSize);
        
        // Add electric glow to sparks
        logo.fillStyle(sparkColor, 0.3);
        logo.fillCircle(sparkX, sparkY, sparkSize * 2);
        logo.fillStyle(sparkColor, 0.1);
        logo.fillCircle(sparkX, sparkY, sparkSize * 3);
      }
      
      // Animate logo entrance
      logo.setScale(0);
      logoGlow.setScale(0);
      
      scene.tweens.add({
        targets: [logo, logoGlow],
        scale: 1.2,
        duration: 1200,
        ease: 'Back.easeOut',
        onComplete: () => {
          scene.tweens.add({
            targets: [logo, logoGlow],
            scale: 1,
            duration: 300,
            ease: 'Power2'
          });
        }
      });
      
      // Continuous pulse animation
      scene.tweens.add({
        targets: [logo, logoGlow],
        scaleX: 1.08,
        scaleY: 1.08,
        duration: 2500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    function createHolographicTitle(scene: Phaser.Scene, x: number, y: number) {
      // Create holographic effect with multiple text layers
      const titleText = 'BOLT BLITZ ⚡️';
      
      // Background glow
      const titleGlow = scene.add.text(x, y, titleText, {
        fontFamily: 'Orbitron, monospace',
        fontSize: '52px',
        color: '#00ffff',
        stroke: '#ffffff',
        strokeThickness: 4,
        shadow: { offsetX: 0, offsetY: 0, blur: 20, color: '#00ffff', fill: true },
      }).setOrigin(0.5).setAlpha(0.6);
      
      // Main title
      appName = scene.add.text(x, y, titleText, {
        fontFamily: 'Orbitron, monospace',
        fontSize: '48px',
        color: '#ffffff',
        stroke: '#00aaff',
        strokeThickness: 2,
        shadow: { offsetX: 2, offsetY: 2, blur: 10, color: '#0066cc', fill: true },
      }).setOrigin(0.5);
      
      // Holographic scan lines effect
      const scanLines = scene.add.graphics();
      for (let i = 0; i < 5; i++) {
        scanLines.lineStyle(1, 0x00ffff, 0.3);
        scanLines.lineBetween(x - 200, y - 20 + i * 8, x + 200, y - 20 + i * 8);
      }
      
      // Animate title entrance
      appName.setAlpha(0);
      titleGlow.setAlpha(0);
      
      scene.tweens.add({
        targets: [appName, titleGlow],
        alpha: 1,
        duration: 800,
        delay: 600,
        ease: 'Power2.easeOut'
      });
      
      // Continuous glow pulse
      scene.tweens.add({
        targets: titleGlow,
        alpha: 0.3,
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    function createAnimatedTagline(scene: Phaser.Scene, x: number, y: number) {
      tagline = scene.add.text(x, y, '', {
        fontFamily: 'Orbitron, monospace',
        fontSize: '28px',
        color: '#88ccff',
        stroke: '#004488',
        strokeThickness: 1,
        shadow: { offsetX: 1, offsetY: 1, blur: 5, color: '#0066cc', fill: true },
      }).setOrigin(0.5);
      
      const taglineText = 'BLITZ YOUR LIMITS';
      let charIndex = 0;
      
      const typeTimer = scene.time.addEvent({
        delay: 100,
        callback: () => {
          tagline.setText(taglineText.slice(0, charIndex + 1));
          charIndex++;
          if (charIndex >= taglineText.length) {
            typeTimer.destroy();
            // Add cursor blink effect
            scene.tweens.add({
              targets: tagline,
              alpha: 0.7,
              duration: 800,
              yoyo: true,
              repeat: -1,
              ease: 'Power2.easeInOut'
            });
          }
        },
        repeat: taglineText.length - 1,
        startAt: 1400,
      });
    }

    function createEnergyProgressBar(scene: Phaser.Scene, width: number, height: number) {
      const barWidth = width * 0.6;
      const barHeight = 12;
      const barX = (width - barWidth) / 2;
      const barY = height - 80;
      
      // Progress container with energy field
      progressContainer = scene.add.graphics();
      progressContainer.lineStyle(2, 0x00aaff, 0.8);
      progressContainer.strokeRoundedRect(barX - 4, barY - 4, barWidth + 8, barHeight + 8, 8);
      
      // Energy field glow
      progressContainer.lineStyle(1, 0x00ffff, 0.4);
      progressContainer.strokeRoundedRect(barX - 8, barY - 8, barWidth + 16, barHeight + 16, 12);
      
      // Progress bar background
      progressBar = scene.add.graphics();
      progressBar.fillStyle(0x001133, 0.6);
      progressBar.fillRoundedRect(barX, barY, barWidth, barHeight, 6);
      
      // Progress fill (will be updated)
      progressFill = scene.add.graphics();
      
      // Progress glow effect
      progressGlow = scene.add.graphics();
      
      // Loading text
      loadingText = scene.add.text(width / 2, barY + 40, 'INITIALIZING QUANTUM SYSTEMS...', {
        fontFamily: 'Orbitron, monospace',
        fontSize: '18px',
        color: '#88aaff',
        stroke: '#002244',
        strokeThickness: 1,
      }).setOrigin(0.5);
    }

    function createCosmicLightning(scene: Phaser.Scene, width: number, height: number) {
      scene.time.addEvent({
        delay: 2000,
        callback: () => {
          const lightning = scene.add.graphics();
          const startX = Math.random() * width;
          const startY = 0;
          const segments = 8;
          
          lightning.lineStyle(3, 0x00ffff, 0.9);
          lightning.beginPath();
          lightning.moveTo(startX, startY);
          
          let currentX = startX;
          let currentY = startY;
          
          for (let i = 0; i < segments; i++) {
            currentX += (Math.random() - 0.5) * 100;
            currentY += height / segments + (Math.random() - 0.5) * 50;
            lightning.lineTo(currentX, currentY);
          }
          
          lightning.strokePath();
          
          // Add glow effect
          lightning.lineStyle(6, 0x00ffff, 0.3);
          lightning.strokePath();
          
          cosmicLightning.push(lightning);
          
          scene.tweens.add({
            targets: lightning,
            alpha: 0,
            duration: 800,
            ease: 'Power2.easeOut',
            onComplete: () => {
              lightning.destroy();
              cosmicLightning = cosmicLightning.filter(l => l !== lightning);
            }
          });
        },
        loop: true
      });
    }

    function updateProgress(scene: Phaser.Scene, progress: number) {
      const { width, height } = scene.cameras.main;
      const barWidth = width * 0.6;
      const barHeight = 12;
      const barX = (width - barWidth) / 2;
      const barY = height - 80;
      
      progressFill.clear();
      progressGlow.clear();
      
      const fillWidth = (barWidth - 4) * (progress / 100);
      
      if (fillWidth > 0) {
        // Main progress fill with energy gradient
        progressFill.fillGradientStyle(0x00ffff, 0x0080ff, 0xff00ff, 0x8000ff, 1);
        progressFill.fillRoundedRect(barX + 2, barY + 2, fillWidth, barHeight - 4, 4);
        
        // Energy glow effect
        progressGlow.fillGradientStyle(0x00ffff, 0x00ffff, 0xff00ff, 0xff00ff, 0.4);
        progressGlow.fillRoundedRect(barX, barY, fillWidth + 4, barHeight, 6);
        
        // Energy particles at progress head
        if (progress < 100) {
          for (let i = 0; i < 3; i++) {
            const sparkX = barX + fillWidth + (Math.random() - 0.5) * 10;
            const sparkY = barY + barHeight / 2 + (Math.random() - 0.5) * 8;
            progressGlow.fillStyle(0x00ffff, 0.8);
            progressGlow.fillCircle(sparkX, sparkY, 2);
          }
        }
      }
      
      // Update loading text based on progress
      const loadingMessages = [
        'INITIALIZING QUANTUM SYSTEMS...',
        'CALIBRATING NEURAL NETWORKS...',
        'SYNCHRONIZING COSMIC DATA...',
        'CHARGING ENERGY CORES...',
        'FINALIZING WARP PROTOCOLS...',
        'READY FOR LAUNCH!'
      ];
      
      const messageIndex = Math.min(Math.floor(progress / 20), loadingMessages.length - 1);
      loadingText.setText(loadingMessages[messageIndex]);
      
      // Add percentage display
      const percentText = scene.add.text(width / 2, barY - 25, `${Math.floor(progress)}%`, {
        fontFamily: 'Orbitron, monospace',
        fontSize: '24px',
        color: '#00ffff',
        stroke: '#004488',
        strokeThickness: 2,
      }).setOrigin(0.5);
      
      scene.tweens.add({
        targets: percentText,
        alpha: 0,
        duration: 100,
        delay: 50,
        onComplete: () => percentText.destroy()
      });
    }

    function updateLayout(scene: Phaser.Scene, width: number, height: number) {
      const centerX = width / 2;
      const centerY = height / 2;
      
      if (logo) logo.setPosition(centerX, centerY - 80);
      if (logoGlow) logoGlow.setPosition(centerX, centerY - 80);
      if (appName) appName.setPosition(centerX, centerY + 40);
      if (tagline) tagline.setPosition(centerX, centerY + 100);
      
      // Update progress bar layout
      if (progressContainer) {
        progressContainer.clear();
        const barWidth = width * 0.6;
        const barHeight = 12;
        const barX = (width - barWidth) / 2;
        const barY = height - 80;
        
        progressContainer.lineStyle(2, 0x00aaff, 0.8);
        progressContainer.strokeRoundedRect(barX - 4, barY - 4, barWidth + 8, barHeight + 8, 8);
        progressContainer.lineStyle(1, 0x00ffff, 0.4);
        progressContainer.strokeRoundedRect(barX - 8, barY - 8, barWidth + 16, barHeight + 16, 12);
      }
      
      if (loadingText) loadingText.setPosition(centerX, height - 40);
      
      updateProgress(scene, loadingProgress);
    }

    return () => {
      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true);
        phaserGameRef.current = null;
      }
      // Reset body styles
      document.body.style.background = '';
      document.body.style.overflow = '';
    };
  }, [router]);

  return (
    <div 
      ref={gameRef} 
      style={{ 
        width: '100vw', 
        height: '100vh',
        background: 'radial-gradient(ellipse at top left, rgba(255, 0, 0, 0.4) 0%, transparent 50%), radial-gradient(ellipse at top right, rgba(255, 255, 0, 0.4) 0%, transparent 50%), radial-gradient(ellipse at bottom left, rgba(128, 0, 128, 0.4) 0%, transparent 50%), radial-gradient(ellipse at bottom right, rgba(0, 0, 255, 0.4) 0%, transparent 50%), radial-gradient(ellipse at center, #0a0a0a 0%, #000000 100%)',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 9999
      }} 
    />
  );
}