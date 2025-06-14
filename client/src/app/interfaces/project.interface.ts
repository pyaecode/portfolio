export interface Project {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  technologies: string[];
  category: 'web' | 'mobile' | 'ai' | 'game' | 'tool';
  status: 'completed' | 'in-progress' | 'concept';
  links: {
    github?: string;
    demo?: string;
    download?: string;
  };
  images: string[];
  features: string[];
  challenges: string[];
  achievements: string[];
  startDate: string;
  endDate?: string;
  teamSize: number;
  role: string;
}
