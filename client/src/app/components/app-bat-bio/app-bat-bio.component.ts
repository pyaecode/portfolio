import { Component, Signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BioService } from '../../services/bio.service';
import { Bio } from '../../interfaces/bio.interface';
import { BaseConsoleComponent } from '../../shared/base-console.component';

@Component({
  selector: 'app-bat-bio',
  imports: [CommonModule],
  templateUrl: './app-bat-bio.component.html',
  styleUrl: './app-bat-bio.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppBatBioComponent extends BaseConsoleComponent {
  bio: Signal<Bio>;

  constructor(private bioService: BioService) {
    super();
    this.bio = this.bioService.bio;
  }

  protected getMainSelector = (): string => '.bat-bio';
  protected getContentSelector = (): string => '.bio-content';

  exitBio = (): void => this.exitConsole();
}
