import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface Project {
  id: string;
  title: string;
  duration: number;
  sourcePath: string;
  status: 'uploaded' | 'analyzing' | 'rendering' | 'completed';
}

interface Clip {
  id: string;
  title: string;
  startSec: number;
  endSec: number;
  viralityScore: number;
  hookSummary: string;
  payoffSummary: string;
  suggestedCaption: string;
}

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  clips: Clip[];
  selectedClip: Clip | null;
  currentStep: number;
  isProcessing: boolean;
  progress: number;
  progressMessage: string;
  error: string | null;

  setProjects: (projects: Project[]) => void;
  setCurrentProject: (project: Project | null) => void;
  setClips: (clips: Clip[]) => void;
  setSelectedClip: (clip: Clip | null) => void;
  setCurrentStep: (step: number) => void;
  setProcessing: (isProcessing: boolean) => void;
  setProgress: (progress: number, message: string) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  projects: [],
  currentProject: null,
  clips: [],
  selectedClip: null,
  currentStep: 0,
  isProcessing: false,
  progress: 0,
  progressMessage: '',
  error: null,
};

export const useProjectStore = create<ProjectState>()(
  devtools((set, get) => ({
    ...initialState,

    setProjects: (projects) => set({ projects }),
    setCurrentProject: (project) => set({ currentProject: project }),
    setClips: (clips) => set({ clips }),
    setSelectedClip: (clip) => set({ selectedClip: clip }),
    setCurrentStep: (step) => set({ currentStep: step }),
    setProcessing: (isProcessing) => set({ isProcessing }),
    setProgress: (progress, message) => set({ progress, progressMessage: message }),
    setError: (error) => set({ error }),
    reset: () => set(initialState),
  }), { name: 'project-store' })
);

export default useProjectStore;