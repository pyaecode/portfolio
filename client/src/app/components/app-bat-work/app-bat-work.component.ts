import { Component, Signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkExperienceService } from '../../services/work-experience.service';
import { WorkExperience } from '../../interfaces/bio.interface';
import { BaseConsoleComponent } from '../../shared/base-console.component';

@Component({
  selector: 'app-bat-work',
  imports: [CommonModule],
  templateUrl: './app-bat-work.component.html',
  styleUrl: './app-bat-work.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppBatWorkComponent extends BaseConsoleComponent {
  workExperience: Signal<WorkExperience | null>;

  constructor(private workExperienceService: WorkExperienceService) {
    super();
    this.workExperience = this.workExperienceService.selectedWorkExperience;
  }

  protected getMainSelector = (): string => '.bat-work';
  protected getContentSelector = (): string => '.work-content';

  protected override handleCustomKeyPress(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        this.previousExperience();
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.nextExperience();
        break;
    }
  }

  exitWork = (): void => this.exitConsole();

  previousExperience = (): void => {
    const experiences = this.workExperienceService.workExperiences();
    const currentIndex = experiences.findIndex(exp => exp.id === this.workExperience()?.id);
    const previousIndex = currentIndex > 0 ? currentIndex - 1 : experiences.length - 1;
    this.workExperienceService.selectWorkExperience(experiences[previousIndex].id);
  };

  nextExperience = (): void => {
    const experiences = this.workExperienceService.workExperiences();
    const currentIndex = experiences.findIndex(exp => exp.id === this.workExperience()?.id);
    const nextIndex = currentIndex < experiences.length - 1 ? currentIndex + 1 : 0;
    this.workExperienceService.selectWorkExperience(experiences[nextIndex].id);
  };

  getVehicleIcon(experienceId: string): string {
    const vehicleIcons: { [key: string]: string } = {
      'kitestring': '🦇',
      'hln': '✈️',
      'cattlab': '🏍️'
    };
    return vehicleIcons[experienceId] || '🏎️';
  }

  getCompanyIcon(companyType: string): string {
    if (companyType.includes('Fortune 500')) return '🏢';
    if (companyType.includes('Agency')) return '🎨';
    if (companyType.includes('Mid-size')) return '🏬';
    return '💼';
  }

  getTechnologyIcon(tech: string): string {
    const techIcons: { [key: string]: string } = {
      'Angular': '🅰️',
      'React': '⚛️',
      'Vue.js': '💚',
      'Node.js': '🟢',
      'TypeScript': '🔷',
      'JavaScript': '🟨',
      'Python': '🐍',
      'AWS': '☁️',
      'Docker': '🐳',
      'Kubernetes': '⚙️',
      'PostgresSQL': '🐘',
      'MongoDB': '🍃',
      'Redis': '🔴',
      'Three.js': '🎮',
      'WebGL': '🎯',
      'GSAP': '⚡'
    };
    return techIcons[tech] || '🔧';
  }
}
