import { Bio, WorkExperience } from './bio.interface';
import { Project } from './project.interface';

export interface PortfolioData {
  bio: Bio;
  projects: Project[];
  workExperiences: WorkExperience[];
}
