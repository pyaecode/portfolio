import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BatcaveInteractionService } from '../../services/batcave-interaction.service';
import { AppCredits } from '../app-credits/app-credits';

@Component({
  selector: 'app-ui-overlay',
  standalone: true,
  imports: [CommonModule, AppCredits],
  templateUrl: './app-ui-overlay.component.html',
  styleUrls: ['./app-ui-overlay.component.scss']
})
export class AppUiOverlayComponent implements OnInit {
  showHelp = signal(false);
  private highlightsTriggeredByClick = false;

  constructor(private batcaveInteractionService: BatcaveInteractionService) {}

  ngOnInit(): void {
    // Register this component with the interaction service
    this.batcaveInteractionService.registerUiOverlayComponent(this);
  }

  toggleHelp(): void {
    this.showHelp.set(!this.showHelp());

    // Trigger highlight clickable objects when help is shown (only if not triggered by click)
    if (this.showHelp() && !this.highlightsTriggeredByClick) {
      this.triggerHighlights();
    }
  }

  hideHelp(): void {
    this.showHelp.set(false);

    // Only disable highlights when help tooltip is hidden if they were triggered by hover, not click
    if (!this.highlightsTriggeredByClick) {
      this.disableHighlights();
    }
  }

  onHelpClick(): void {
    // Mark that highlights were triggered by click (will be reset by user interaction detection)
    this.highlightsTriggeredByClick = true;

    // Trigger highlights on click - they will be disabled by normal user interaction detection
    this.triggerHighlights();
  }

  private triggerHighlights(): void {
    console.debug('UI Overlay: Triggering highlight clickable objects');
    this.batcaveInteractionService.triggerHighlightClickableObjects();
  }

  private disableHighlights(): void {
    console.debug('UI Overlay: Disabling highlight clickable objects');
    this.batcaveInteractionService.disableHighlightClickableObjects();
  }

  /**
   * Callback method called when highlights are disabled by user interaction in the 3D scene
   */
  public onHighlightsDisabledByUserInteraction(): void {
    console.debug('UI Overlay: Highlights disabled by user interaction, resetting click flag');
    this.highlightsTriggeredByClick = false;
  }
}
