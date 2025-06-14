import { OnInit, OnDestroy, Output, EventEmitter, signal, Directive } from '@angular/core';
import { gsap } from 'gsap';
import { ANIMATION_CONFIG, CONSOLE_CONFIG } from '../constants/app.constants';

@Directive()
export abstract class BaseConsoleComponent implements OnInit, OnDestroy {
  @Output() consoleExit = new EventEmitter<void>();

  isVisible = signal(false);

  protected fadeTimeline?: gsap.core.Timeline;
  private boundKeyHandler = this.handleKeyPress.bind(this);

  ngOnInit(): void {
    document.addEventListener('keydown', this.boundKeyHandler);
  }

  ngOnDestroy(): void {
    document.removeEventListener('keydown', this.boundKeyHandler);
    this.fadeTimeline?.kill();
  }

  show(): void {
    if (this.isVisible()) return;

    this.isVisible.set(true);
    this.fadeTimeline = gsap.timeline();
    this.fadeTimeline
      .set(this.getMainSelector(), { opacity: 0, scale: CONSOLE_CONFIG.SCALE_FROM })
      .to(this.getMainSelector(), {
        opacity: 1,
        scale: CONSOLE_CONFIG.SCALE_TO,
        duration: ANIMATION_CONFIG.DURATIONS.SLOW,
        ease: ANIMATION_CONFIG.EASING.POWER_OUT
      })
      .from('.console-header', {
        y: CONSOLE_CONFIG.HEADER_OFFSET,
        opacity: 0,
        duration: ANIMATION_CONFIG.DURATIONS.NORMAL,
        ease: ANIMATION_CONFIG.EASING.POWER_OUT
      }, ANIMATION_CONFIG.DELAYS.SHORT)
      .from(this.getContentSelector(), {
        y: CONSOLE_CONFIG.CONTENT_OFFSET,
        opacity: 0,
        duration: ANIMATION_CONFIG.DURATIONS.SLOW,
        ease: ANIMATION_CONFIG.EASING.POWER_OUT
      }, ANIMATION_CONFIG.DELAYS.MEDIUM);
  }

  hide(): void {
    if (!this.isVisible()) return;

    this.fadeTimeline = gsap.timeline({
      onComplete: () => this.isVisible.set(false)
    });

    this.fadeTimeline.to(this.getMainSelector(), {
      opacity: 0,
      scale: CONSOLE_CONFIG.SCALE_FROM,
      duration: CONSOLE_CONFIG.FADE_DURATION,
      ease: ANIMATION_CONFIG.EASING.POWER_IN
    });
  }

  protected exitConsole(): void {
    this.consoleExit.emit();
    this.hide();
  }

  private handleKeyPress(event: KeyboardEvent): void {
    if (!this.isVisible()) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      this.hide(); // Just hide, don't call exitConsole to avoid recursion
    } else {
      this.handleCustomKeyPress(event);
    }
  }

  protected abstract getMainSelector(): string;
  protected abstract getContentSelector(): string;
  protected handleCustomKeyPress(_event: KeyboardEvent): void {}
}
