import { Component, AfterViewInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { gsap } from 'gsap';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { TextPlugin } from 'gsap/TextPlugin';
import { LoadingService } from '../../services/loading.service';
import { ANIMATION_CONFIG } from '../../constants/app.constants';

gsap.registerPlugin(DrawSVGPlugin, TextPlugin);

// currently unused, but it was fun
@Component({
  selector: 'app-loading',
  standalone: true,
  templateUrl: './app-loading.component.html',
  styleUrls: ['./app-loading.component.scss']
})
export class AppLoadingComponent implements AfterViewInit, OnDestroy {
  @ViewChild('backgroundBoard', { static: true }) backgroundBoardRef!: ElementRef<SVGGElement>;

  private masterTimeline!: gsap.core.Timeline;
  private traceOutTimeline!: gsap.core.Timeline;
  private resizeHandler!: () => void;
  private mouseMoveHandler!: () => void;
  public animationComplete = false;
  public traceOutTriggered = false;

  constructor(private loadingService: LoadingService) {}

  ngAfterViewInit(): void {
    window.requestAnimationFrame(() => {
      this.updateBackgroundBoardSize();
      this.createAnimation();
    });

    this.resizeHandler = () => this.updateBackgroundBoardSize();
    window.addEventListener('resize', this.resizeHandler);
  }

  updateBackgroundBoardSize(): void {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const svg = this.backgroundBoardRef.nativeElement.closest('svg');
    if (svg) {
      svg.setAttribute('viewBox', `0 0 ${viewportWidth} ${viewportHeight}`);
    }

    const originalWidth = 1024;
    const originalHeight = 640;

    const scaleX = viewportWidth / originalWidth;
    const scaleY = viewportHeight / originalHeight;

    const scale = Math.max(scaleX, scaleY);

    this.backgroundBoardRef.nativeElement.setAttribute('transform', `scale(${scale})`);

    const mainPath = this.backgroundBoardRef.nativeElement.querySelector('#path1');
    if (mainPath) {
      const effectiveWidth = viewportWidth / scale;
      const effectiveHeight = viewportHeight / scale;
      const pathData = `M 0,0 H ${effectiveWidth} V ${effectiveHeight} H 0 Z`;
      mainPath.setAttribute('d', pathData);
    }
  }

  createAnimation(): void {
    this.masterTimeline = gsap.timeline({
      repeat: 0,
      onComplete: () => {
        this.animationComplete = true;
        this.setupMouseMoveListener();
      }
    });

    this.masterTimeline.to([...this.backgroundBoardRef.nativeElement.querySelectorAll('path')], {
      drawSVG: "0% 100%",
      strokeOpacity: 1,
      duration: 4,
      stagger: ANIMATION_CONFIG.STAGGER.NORMAL,
      ease: ANIMATION_CONFIG.EASING.SINE_OUT,
    });
  }

  setupMouseMoveListener(): void {
    this.mouseMoveHandler = () => {
      if (this.animationComplete && !this.traceOutTriggered) {
        this.startTraceOutAnimation();
        document.removeEventListener('mousemove', this.mouseMoveHandler);
      }
    };
    document.addEventListener('mousemove', this.mouseMoveHandler);
  }

  startTraceOutAnimation(): void {
    if (this.traceOutTriggered) return;

    this.traceOutTriggered = true;
    this.traceOutTimeline = gsap.timeline({
      onComplete: () => this.loadingService.setLoading(false)
    });

    const allPaths = [...this.backgroundBoardRef.nativeElement.querySelectorAll('path')].reverse();
    this.traceOutTimeline.to(allPaths, {
      drawSVG: "100% 100%",
      strokeOpacity: 0,
      duration: 0.5,
      stagger: ANIMATION_CONFIG.STAGGER.FAST,
      ease: ANIMATION_CONFIG.EASING.POWER_IN_OUT,
    });
  }

  ngOnDestroy(): void {
    this.masterTimeline?.kill();
    this.traceOutTimeline?.kill();
    if (this.resizeHandler) window.removeEventListener('resize', this.resizeHandler);
    if (this.mouseMoveHandler) document.removeEventListener('mousemove', this.mouseMoveHandler);
  }
}
