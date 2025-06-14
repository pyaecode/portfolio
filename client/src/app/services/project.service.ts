import { Injectable, signal } from '@angular/core';
import { Project } from '../interfaces/project.interface';
import { DataLoader } from '../utils/data.util';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private projectsSignal = signal<Project[]>([]);

  private selectedProjectSignal = signal<Project | null>(null);

  public projects = this.projectsSignal.asReadonly();
  public selectedProject = this.selectedProjectSignal.asReadonly();

  constructor() {
    void this.loadProjects();
  }

  private async loadProjects(): Promise<void> {
    try {
      const projects = await DataLoader.loadProjects();
      this.projectsSignal.set(projects);
      if (projects.length > 0) {
        this.selectedProjectSignal.set(projects[0]);
      }
    } catch (error) {
      this.projectsSignal.set([]);
    }
  }

  selectProject(projectId: string): void {
    const project = this.projectsSignal().find(p => p.id === projectId);
    if (project) {
      this.selectedProjectSignal.set(project);
    }
  }
}
