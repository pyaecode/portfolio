import { Routes } from '@angular/router';
import { AppHomeComponent } from './components/app-home/app-home.component';

export const routes: Routes = [
  { path: '', component: AppHomeComponent },
  { path: 'home', redirectTo: '', pathMatch: 'full' },
  { path: '**', redirectTo: '' }
];
