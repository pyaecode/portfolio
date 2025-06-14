import { Injectable } from '@angular/core';
import { gsap } from 'gsap';

@Injectable({
  providedIn: 'root'
})
export class BatRevealService {
  private isAnimating = false;
  private batRevealComponent?: any;

  constructor() {}

  /**
   * Registers the bat reveal component instance
   */
  registerBatRevealComponent(component: any): void {
    console.debug('BatRevealService: Registering bat reveal component');
    this.batRevealComponent = component;
  }

  /**
   * Triggers the bat reveal animation
   */
  async triggerBatReveal(): Promise<void> {
    console.debug('BatRevealService: triggerBatReveal called');

    if (this.isAnimating) {
      console.debug('Bat reveal animation already in progress');
      return;
    }

    if (!this.batRevealComponent) {
      console.warn('Bat reveal component not registered, falling back to simple fade');
      this.fallbackHideInitialLoading();
      return;
    }

    try {
      console.debug('Starting bat reveal animation...');
      this.isAnimating = true;

      await this.batRevealComponent.startRevealAnimation();
      console.debug('Bat reveal animation completed');
    } catch (error) {
      console.error('Error during bat reveal animation:', error);
      this.fallbackHideInitialLoading();
    } finally {
      this.isAnimating = false;
    }
  }

  /**
   * Fallback method for hiding initial loading without bat animation
   */
  private fallbackHideInitialLoading(): void {
    const initialLoading = document.getElementById('initial-loading');
    if (initialLoading) {
      initialLoading.style.transition = 'opacity 1s ease-in-out';
      initialLoading.style.opacity = '0';
      setTimeout(() => {
        initialLoading.classList.add('hidden');
      }, 1000);
    }
  }

  /**
   * Checks if the bat reveal animation is currently running
   */
  isRevealAnimating(): boolean {
    return this.isAnimating;
  }
}
