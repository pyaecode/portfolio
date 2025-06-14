import { Component, OnInit, OnDestroy } from '@angular/core';
import { LoadingService } from './services/loading.service';
import { AppHomeComponent } from './components/app-home/app-home.component';
import { AppBatRevealComponent } from './components/app-bat-reveal/app-bat-reveal.component';
import { AppUiOverlayComponent } from './components/app-ui-overlay/app-ui-overlay.component';
import { APP_CONFIG } from './constants/app.constants';

@Component({
  selector: 'app-root',
  imports: [AppHomeComponent, AppBatRevealComponent, AppUiOverlayComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit, OnDestroy {
  protected title = APP_CONFIG.TITLE;
  private fallbackTimeout?: number;

  constructor(public loadingService: LoadingService) {}

  get loading() {
    return this.loadingService.loading;
  }

  ngOnInit(): void {
    this.fallbackTimeout = window.setTimeout(() => {
      console.warn('Loading timeout reached, forcing completion');
      this.loadingService.hideInitialLoading();
    }, APP_CONFIG.FALLBACK_TIMEOUT);
  }
  ngOnDestroy(): void {
    if (this.fallbackTimeout) {
      clearTimeout(this.fallbackTimeout);
    }
  }
}
