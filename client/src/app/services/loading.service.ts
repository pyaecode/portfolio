import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingSignal = signal(true);
  private progressSignal = signal(0);
  private statusSignal = signal('Initializing Batcave...');
  private isInitialLoadingHidden = false;

  public loading = this.loadingSignal.asReadonly();
  public progress = this.progressSignal.asReadonly();
  public status = this.statusSignal.asReadonly();

  constructor() {
    console.debug('LoadingService initialized with loading signal:', this.loadingSignal());
  }

  setLoading(loading: boolean): void {
    console.debug('LoadingService: Setting loading signal to', loading);
    this.loadingSignal.set(loading);
  }

  setProgress(progress: number): void {
    const clampedProgress = Math.max(0, Math.min(100, progress));
    console.debug('LoadingService: Setting progress to', clampedProgress);
    this.progressSignal.set(clampedProgress);
  }

  setStatus(status: string): void {
    console.debug('LoadingService: Setting status to', status);
    this.statusSignal.set(status);
  }

  reset(): void {
    this.loadingSignal.set(true);
    this.progressSignal.set(0);
    this.statusSignal.set('Initializing Batcave...');
    this.isInitialLoadingHidden = false;
  }

  /**
   * Hides the initial HTML loading screen with a smooth fade transition
   * @param delay Optional delay in milliseconds before hiding (default: 0)
   */
  hideInitialLoading(delay: number = 0): void {
    if (this.isInitialLoadingHidden) {
      console.debug('Initial loading already hidden');
      return;
    }

    const hideFunction = () => {
      const initialLoading = document.getElementById('initial-loading');
      if (initialLoading) {
        initialLoading.style.transition = 'opacity 1s ease-in-out';
        initialLoading.style.opacity = '0';
        setTimeout(() => {
          initialLoading.classList.add('hidden');
          this.isInitialLoadingHidden = true;
          console.debug('Initial loading screen hidden');
        }, 1000);
      } else {
        console.warn('Initial loading element not found');
        this.isInitialLoadingHidden = true;
      }
    };

    if (delay > 0) {
      setTimeout(hideFunction, delay);
    } else {
      hideFunction();
    }
  }

  /**
   * Updates the loading status text in the initial HTML loading screen
   * @param status The status message to display
   */
  updateInitialStatus(status: string): void {
    const statusElement = document.getElementById('loading-status');
    if (statusElement) {
      statusElement.textContent = status;
    }
  }

  /**
   * Updates the loading status with a percentage in the initial HTML loading screen
   * @param percentage The percentage complete (0-100)
   * @param prefix Optional prefix text (default: "Loading 3D Model")
   */
  updateInitialProgress(percentage: number, prefix: string = 'Loading 3D Model'): void {
    // Clamp percentage to valid range
    const clampedPercentage = Math.max(0, Math.min(100, percentage));

    const statusElement = document.getElementById('loading-status');
    if (statusElement) {
      statusElement.textContent = `${prefix}: ${clampedPercentage.toFixed(2)}%`;
    }
  }

  /**
   * Checks if the initial loading screen is still visible
   */
  isInitialLoadingVisible(): boolean {
    const initialLoading = document.getElementById('initial-loading');
    return !!initialLoading && !initialLoading.classList.contains('hidden') && !this.isInitialLoadingHidden;
  }
}
