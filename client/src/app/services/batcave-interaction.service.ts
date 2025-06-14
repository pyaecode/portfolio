import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class BatcaveInteractionService {
  private batcaveComponent?: any;
  private uiOverlayComponent?: any;

  constructor() {}

  /**
   * Registers the batcave component instance
   */
  registerBatcaveComponent(component: any): void {
    console.debug('BatcaveInteractionService: Registering batcave component');
    this.batcaveComponent = component;
  }

  /**
   * Registers the UI overlay component instance
   */
  registerUiOverlayComponent(component: any): void {
    console.debug('BatcaveInteractionService: Registering UI overlay component');
    this.uiOverlayComponent = component;
  }

  /**
   * Triggers the highlight clickable objects functionality
   */
  triggerHighlightClickableObjects(): void {
    console.debug('BatcaveInteractionService: triggerHighlightClickableObjects called');

    if (!this.batcaveComponent) {
      console.warn('Batcave component not registered, cannot trigger highlights');
      return;
    }

    try {
      console.debug('Triggering highlight clickable objects...');
      this.batcaveComponent.triggerHighlightClickableObjects();
    } catch (error) {
      console.error('Error triggering highlight clickable objects:', error);
    }
  }

  /**
   * Disables the highlight clickable objects functionality
   */
  disableHighlightClickableObjects(): void {
    console.debug('BatcaveInteractionService: disableHighlightClickableObjects called');

    if (!this.batcaveComponent) {
      console.warn('Batcave component not registered, cannot disable highlights');
      return;
    }

    try {
      console.debug('Disabling highlight clickable objects...');
      this.batcaveComponent.disableHighlightClickableObjects();
    } catch (error) {
      console.error('Error disabling highlight clickable objects:', error);
    }
  }

  /**
   * Notifies the UI overlay that highlights were disabled by user interaction
   */
  notifyHighlightsDisabledByUserInteraction(): void {
    console.debug('BatcaveInteractionService: Notifying UI overlay that highlights were disabled by user interaction');

    if (this.uiOverlayComponent && typeof this.uiOverlayComponent.onHighlightsDisabledByUserInteraction === 'function') {
      this.uiOverlayComponent.onHighlightsDisabledByUserInteraction();
    }
  }

  /**
   * Checks if the batcave component is registered
   */
  isBatcaveComponentRegistered(): boolean {
    return !!this.batcaveComponent;
  }
}
