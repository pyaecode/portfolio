import { Project } from '../interfaces/project.interface';
import { WorkExperience, Bio } from '../interfaces/bio.interface';
import { PortfolioData } from '../interfaces/portfolio-data.interface';

export class DataLoader {
  private static cache = new Map<string, any>();
  private static portfolioData: PortfolioData | null = null;

  private static async loadPortfolioData(): Promise<PortfolioData> {
    if (this.portfolioData) {
      return this.portfolioData;
    }

    try {
      const data = await import('../data/portfolio-data.json');
      this.portfolioData = data.default as PortfolioData;
      return this.portfolioData;
    } catch (error) {
      throw new Error(`Failed to load portfolio data: ${error}`);
    }
  }

  static async loadProjects(): Promise<Project[]> {
    return this.loadData<Project[]>('projects', async () => {
      const data = await this.loadPortfolioData();
      return data.projects;
    });
  }

  static async loadWorkExperiences(): Promise<WorkExperience[]> {
    return this.loadData<WorkExperience[]>('workExperiences', async () => {
      const data = await this.loadPortfolioData();
      return data.workExperiences;
    });
  }

  static async loadBio(): Promise<Bio> {
    return this.loadData<Bio>('bio', async () => {
      const data = await this.loadPortfolioData();
      return data.bio;
    });
  }

  private static async loadData<T>(key: string, loader: () => Promise<T>): Promise<T> {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    try {
      const data = await loader();
      this.cache.set(key, data);
      return data;
    } catch (error) {
      throw new Error(`Failed to load ${key}: ${error}`);
    }
  }
}
