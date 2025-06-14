export interface Bio {
  name: string;
  title: string;
  summary: string;
  location: string;
  email: string;
  linkedIn: string;
  skills: {
    category: string;
    items: string[];
  }[];
  education: {
    institution: string;
    degree: string;
    year: string;
  }[];
  certifications: string[];
  languages: {
    language: string;
    proficiency: string;
  }[];
  interests: string[];
}

export interface WorkExperience {
  id: string;
  company: string;
  position: string;
  duration: string;
  description: string;
  responsibilities: string[];
  technologies: string[];
  achievements: string[];
  teamSize?: number;
  location: string;
  companyType: string;
  projects: {
    name: string;
    description: string;
    technologies: string[];
  }[];
}
