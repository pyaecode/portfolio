import { Injectable, signal } from '@angular/core';
import { WorkExperience } from '../interfaces/bio.interface';
import { DataLoader } from '../utils/data.util';

@Injectable({
  providedIn: 'root'
})
export class WorkExperienceService {
  private workExperiencesSignal = signal<WorkExperience[]>([]);

  private selectedWorkExperienceSignal = signal<WorkExperience | null>(null);

  public workExperiences = this.workExperiencesSignal.asReadonly();
  public selectedWorkExperience = this.selectedWorkExperienceSignal.asReadonly();

  constructor() {
    void this.loadWorkExperiences();
  }

  private async loadWorkExperiences(): Promise<void> {
    try {
      const experiences = await DataLoader.loadWorkExperiences();
      this.workExperiencesSignal.set(experiences);
      if (experiences.length > 0) {
        this.selectedWorkExperienceSignal.set(experiences[0]);
      }
    } catch (error) {
      this.workExperiencesSignal.set([]);
    }
  }

  selectWorkExperience(experienceId: string): void {
    const experience = this.workExperiencesSignal().find(exp => exp.id === experienceId);
    if (experience) {
      this.selectedWorkExperienceSignal.set(experience);
    }
  }

  getWorkExperienceById = (id: string): WorkExperience | undefined =>
    this.workExperiencesSignal().find(exp => exp.id === id);

  getWorkExperienceByVehicle = (vehicleName: string): WorkExperience | undefined => {
    const vehicleToExperienceMap: Record<string, string> = {
      'batmobile': 'kitestring',
      'batwing': 'hln',
      'batbike': 'cattlab'
    };

    const experienceId = vehicleToExperienceMap[vehicleName];
    return experienceId ? this.getWorkExperienceById(experienceId) : undefined;
  };
}
