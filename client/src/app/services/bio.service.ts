import { Injectable, signal } from '@angular/core';
import { Bio } from '../interfaces/bio.interface';
import { DataLoader } from '../utils/data.util';

@Injectable({
  providedIn: 'root'
})
export class BioService {
  private bioSignal = signal<Bio>({} as Bio);

  public bio = this.bioSignal.asReadonly();

  constructor() {
    void this.loadBio();
  }

  private async loadBio(): Promise<void> {
    try {
      const bio = await DataLoader.loadBio();
      this.bioSignal.set(bio);
    } catch (error) {
      this.bioSignal.set({} as Bio);
    }
  }
}
