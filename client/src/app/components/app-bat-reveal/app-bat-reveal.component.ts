import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { gsap } from 'gsap';
import { BatRevealService } from '../../services/bat-reveal.service';

@Component({
  selector: 'app-bat-reveal',
  standalone: true,
  templateUrl: './app-bat-reveal.component.html',
  styleUrls: ['./app-bat-reveal.component.scss']
})
export class AppBatRevealComponent implements AfterViewInit, OnDestroy {
  @ViewChild('revealContainer', { static: true }) revealContainerRef!: ElementRef<HTMLDivElement>;

  private masterTimeline?: gsap.core.Timeline;
  private bats: HTMLElement[] = [];
  private isAnimating = false;

  constructor(private batRevealService: BatRevealService) {}

  ngAfterViewInit(): void {
    console.debug('BatRevealComponent: ngAfterViewInit called');

    // Ensure main content is hidden initially and container is ready
    const mainContent = document.querySelector('.main-content') as HTMLElement;
    if (mainContent) {
      mainContent.style.opacity = '0';
      mainContent.style.visibility = 'hidden';
      mainContent.classList.remove('bat-reveal-ready');
    }

    // Set initial background to transparent
    this.revealContainerRef.nativeElement.style.backgroundColor = 'transparent';

    this.createBatElements();
    this.batRevealService.registerBatRevealComponent(this);
    console.debug('BatRevealComponent: Created', this.bats.length, 'bat elements');


  }

  ngOnDestroy(): void {
    this.masterTimeline?.kill();
    this.cleanup();
  }

  private createBatElements(): void {
    const container = this.revealContainerRef.nativeElement;
    const batCount = 50; // Number of bats to create (increased for more dramatic effect)

    console.debug('BatRevealComponent: Creating', batCount, 'bat elements');

    for (let i = 0; i < batCount; i++) {
      const bat = document.createElement('div');
      bat.className = 'bat-silhouette';
      bat.innerHTML = this.getBatSVG();

      // Random initial positioning around the edges
      const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
      const size = 40 + Math.random() * 60; // Random size between 40-100px

      bat.style.width = `${size}px`;
      bat.style.height = `${size}px`;
      bat.style.position = 'absolute';
      bat.style.opacity = '0';
      bat.style.zIndex = '10003';



      // Position bats further from the edges of the screen for more dramatic entrance
      switch (side) {
        case 0: // top
          bat.style.left = `${Math.random() * 100}%`;
          bat.style.top = '-200px';
          break;
        case 1: // right
          bat.style.right = '-200px';
          bat.style.top = `${Math.random() * 100}%`;
          break;
        case 2: // bottom
          bat.style.left = `${Math.random() * 100}%`;
          bat.style.bottom = '-200px';
          break;
        case 3: // left
          bat.style.left = '-200px';
          bat.style.top = `${Math.random() * 100}%`;
          break;
      }

      container.appendChild(bat);
      this.bats.push(bat);
    }

    console.debug('BatRevealComponent: Created', this.bats.length, 'bats and added to container');
  }

  private getBatSVG(): string {
    return `
      <svg viewBox="0 0 726 252.17" xmlns="http://www.w3.org/2000/svg">
        <path
          fill="rgba(0, 0, 0, 0.9)"
          d="M483.92 0S481.38 24.71 466 40.11c-11.74 11.74-24.09 12.66-40.26 15.07-9.42 1.41-29.7 3.77-34.81-.79-2.37-2.11-3-21-3.22-27.62-.21-6.92-1.36-16.52-2.82-18-.75 3.06-2.49 11.53-3.09 13.61S378.49 34.3 378 36a85.13 85.13 0 0 0-30.09 0c-.46-1.67-3.17-11.48-3.77-13.56s-2.34-10.55-3.09-13.61c-1.45 1.45-2.61 11.05-2.82 18-.21 6.67-.84 25.51-3.22 27.62-5.11 4.56-25.38 2.2-34.8.79-16.16-2.47-28.51-3.39-40.21-15.13C244.57 24.71 242 0 242 0H0s69.52 22.74 97.52 68.59c16.56 27.11 14.14 58.49 9.92 74.73C170 140 221.46 140 273 158.57c69.23 24.93 83.2 76.19 90 93.6 6.77-17.41 20.75-68.67 90-93.6 51.54-18.56 103-18.59 165.56-15.25-4.21-16.24-6.63-47.62 9.93-74.73C656.43 22.74 726 0 726 0z"
        />
      </svg>
    `;
  }

  public startRevealAnimation(): Promise<void> {
    console.debug('BatRevealComponent: startRevealAnimation called');
    return new Promise((resolve) => {
      if (this.isAnimating) {
        console.debug('BatRevealComponent: Animation already in progress');
        resolve();
        return;
      }

      if (this.bats.length === 0) {
        console.warn('BatRevealComponent: No bats created yet, cannot start animation');
        resolve();
        return;
      }

      console.debug('BatRevealComponent: Starting animation with', this.bats.length, 'bats');
      this.isAnimating = true;

      // Temporarily set body background to prevent white flash
      const originalBodyBg = document.body.style.backgroundColor;
      document.body.style.backgroundColor = '#000200';

      this.masterTimeline = gsap.timeline({
        onComplete: () => {
          console.debug('BatRevealComponent: Animation completed');
          // Restore original body background
          document.body.style.backgroundColor = originalBodyBg;
          this.isAnimating = false;
          resolve();
        }
      });

      // Phase 1: Bats fly in quickly from edges
      this.masterTimeline?.to(this.bats, {
        opacity: 1,
        duration: 0.6,
        stagger: 0.03,
        ease: "sine.out"
      });

      // Animate bats to center positions
      this.bats.forEach((bat, index) => {
        const centerX = window.innerWidth / 2 + (Math.random() - 0.5) * 400;
        const centerY = window.innerHeight / 2 + (Math.random() - 0.5) * 400;
        const rotation = Math.random() * 360;
        const scale = 0.8 + Math.random() * 0.4;

        this.masterTimeline?.to(bat, {
          x: centerX - bat.offsetLeft,
          y: centerY - bat.offsetTop,
          rotation: rotation,
          scale: scale,
          duration: 1.2,
          ease: "sine.inOut"
        }, 0.2 + index * 0.02);
      });

      // Phase 2: Create black screen as bats converge
      this.masterTimeline?.to(this.revealContainerRef.nativeElement, {
        backgroundColor: 'rgba(0, 0, 0, 1)',
        duration: 0.8,
        ease: "sine.inOut"
      }, 1.0);

      // Phase 3: Hide loading screen only when black screen is fully covering
      this.masterTimeline?.call(() => {
        const initialLoading = document.getElementById('initial-loading');
        if (initialLoading) {
          initialLoading.style.transition = 'opacity 0.2s ease-out';
          initialLoading.style.opacity = '0';
          setTimeout(() => {
            initialLoading.classList.add('hidden');
          }, 200);
        }

        // Show the model immediately during black screen
        const mainContent = document.querySelector('.main-content') as HTMLElement;
        if (mainContent) {
          mainContent.classList.add('bat-reveal-ready');
          mainContent.style.transition = 'none';
          mainContent.style.opacity = '1';
          mainContent.style.visibility = 'visible';
        }
      }, [], 1.8);

      // Phase 4: Very brief pause with black screen
      this.masterTimeline?.to({}, {
        duration: 0.3
      }, 1.9);

      // Phase 5: Bats fly away to reveal the scene
      this.bats.forEach((bat, index) => {
        // Determine exit direction (back to original edges)
        const side = index % 4; // 0: top, 1: right, 2: bottom, 3: left
        let exitX = 0, exitY = 0;

        switch (side) {
          case 0: // top
            exitX = Math.random() * window.innerWidth;
            exitY = -300;
            break;
          case 1: // right
            exitX = window.innerWidth + 300;
            exitY = Math.random() * window.innerHeight;
            break;
          case 2: // bottom
            exitX = Math.random() * window.innerWidth;
            exitY = window.innerHeight + 300;
            break;
          case 3: // left
            exitX = -300;
            exitY = Math.random() * window.innerHeight;
            break;
        }

        // Animate bat flying off screen
        this.masterTimeline?.to(bat, {
          x: exitX - bat.offsetLeft,
          y: exitY - bat.offsetTop,
          rotation: Math.random() * 360,
          scale: 0.3,
          duration: 1.2,
          ease: "sine.in"
        }, 2.2 + index * 0.02);

        // Fade out as it flies away (starts halfway through movement)
        this.masterTimeline?.to(bat, {
          opacity: 0,
          duration: 0.6,
          ease: "sine.in"
        }, 2.8 + index * 0.02);
      });

      // Phase 6: Fade out the black overlay quickly to reveal the batcave
      this.masterTimeline?.to(this.revealContainerRef.nativeElement, {
        backgroundColor: 'rgba(0, 0, 0, 0)',
        duration: 0.6,
        ease: "sine.out"
      }, 2.4);

      // Phase 7: Clean up
      this.masterTimeline?.call(() => {
        this.cleanup();
      }, [], 4.2);
    });
  }

  private cleanup(): void {
    const container = this.revealContainerRef.nativeElement;
    this.bats.forEach(bat => {
      if (bat.parentNode) {
        bat.parentNode.removeChild(bat);
      }
    });
    this.bats = [];
    container.style.backgroundColor = 'transparent';
    container.style.pointerEvents = 'none';

    // Ensure main content remains visible after cleanup
    const mainContent = document.querySelector('.main-content') as HTMLElement;
    if (mainContent) {
      mainContent.style.transition = 'opacity 0.3s ease-out';
      mainContent.style.opacity = '1';
      mainContent.style.visibility = 'visible';
      mainContent.classList.add('bat-reveal-ready');
    }
  }
}
