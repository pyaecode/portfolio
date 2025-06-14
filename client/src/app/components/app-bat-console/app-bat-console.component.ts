import { Component, OnInit, OnDestroy, AfterViewInit, Output, EventEmitter, signal, computed, effect, Signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectService } from '../../services/project.service';
import { Project } from '../../interfaces/project.interface';
import { gsap } from 'gsap';

@Component({
  selector: 'app-bat-console',
  imports: [CommonModule],
  templateUrl: './app-bat-console.component.html',
  styleUrl: './app-bat-console.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppBatConsoleComponent implements OnInit, AfterViewInit, OnDestroy {
  @Output() consoleExit = new EventEmitter<void>();

  isVisible = signal(false);
  currentProjectIndex = signal(0);

  projects: Signal<Project[]>;
  selectedProject: Signal<Project | null>;

  dialRotation = computed(() => {
    const totalProjects = this.projects().length;
    if (totalProjects === 0) return 0;
    return (this.currentProjectIndex() * 360) / totalProjects;
  });

  currentProjectTechnologies = computed(() => {
    const project = this.selectedProject();
    return project?.technologies || [];
  });

  currentProjectFeatures = computed(() => {
    const project = this.selectedProject();
    return project?.features || [];
  });

  private fadeTimeline?: gsap.core.Timeline;
  private boundKeyHandler = this.handleKeyPress.bind(this);

  constructor(private projectService: ProjectService) {
    this.projects = this.projectService.projects;
    this.selectedProject = this.projectService.selectedProject;

    effect(() => {
      const projects = this.projects();
      const currentIndex = this.currentProjectIndex();
      if (projects.length > 0 && projects[currentIndex]) {
        this.projectService.selectProject(projects[currentIndex].id);
      }
    });
  }

  ngOnInit(): void {
    document.addEventListener('keydown', this.boundKeyHandler);
  }

  ngAfterViewInit(): void {
  }

  ngOnDestroy(): void {
    document.removeEventListener('keydown', this.boundKeyHandler);

    if (this.fadeTimeline) {
      this.fadeTimeline.kill();
    }
  }

  show(): void {
    if (this.isVisible()) return;

    this.isVisible.set(true);

    setTimeout(() => {
      this.fadeTimeline = gsap.timeline();
      this.fadeTimeline
        .set('.bat-console', { opacity: 0, scale: 0.8 })
        .to('.bat-console', {
          opacity: 1,
          scale: 1,
          duration: 1.0,
          ease: 'power2.out'
        })
        .from('.console-header', {
          y: -50,
          opacity: 0,
          duration: 0.6,
          ease: 'power2.out'
        }, 0.3)
        .from('.project-dial', {
          scale: 0,
          rotation: -180,
          opacity: 0,
          duration: 0.8,
          ease: 'back.out(1.7)'
        }, 0.5)
        .from('.project-details', {
          x: 100,
          opacity: 0,
          duration: 0.6,
          ease: 'power2.out'
        }, 0.8);
    }, 0);
  }

  hide(): void {
    if (!this.isVisible()) return;

    this.fadeTimeline = gsap.timeline({
      onComplete: () => {
        this.isVisible.set(false);
      }
    });

    this.fadeTimeline
      .to('.bat-console', {
        opacity: 0,
        scale: 0.8,
        duration: 0.6,
        ease: 'power2.in'
      });
  }

  exitConsole(): void {
    this.consoleExit.emit();
    this.hide();
  }

  nextProject(): void {
    const totalProjects = this.projects().length;
    if (totalProjects === 0) return;

    const newIndex = (this.currentProjectIndex() + 1) % totalProjects;
    this.currentProjectIndex.set(newIndex);
  }

  previousProject(): void {
    const totalProjects = this.projects().length;
    if (totalProjects === 0) return;

    const newIndex = this.currentProjectIndex() === 0 ? totalProjects - 1 : this.currentProjectIndex() - 1;
    this.currentProjectIndex.set(newIndex);
  }

  selectProjectByIndex(index: number): void {
    if (index === this.currentProjectIndex()) return;

    this.currentProjectIndex.set(index);
  }



  private handleKeyPress(event: KeyboardEvent): void {
    if (!this.isVisible()) return;

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        this.exitConsole();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        this.previousProject();
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.nextProject();
        break;
    }
  }

  openLink(url: string): void {
    window.open(url, '_blank');
  }

  getCategoryIcon(category: Project['category']): string {
    switch (category) {
      case 'web': return '🌐';
      case 'mobile': return '📱';
      case 'ai': return '🤖';
      case 'game': return '🎮';
      case 'tool': return '🔧';
      default: return '💻';
    }
  }

  getStatusColor(status: Project['status']): string {
    switch (status) {
      case 'completed': return '#00ff00';
      case 'in-progress': return '#ffaa00';
      case 'concept': return '#0099ff';
      default: return '#ffffff';
    }
  }


}
