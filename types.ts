
export enum AppState {
  LOGIN,
  SIGNUP,
  API_KEY_CHECK,
  UPLOAD,
  SELECT_ANIMATION,
  GENERATING,
  VIEW_VIDEO
}

export interface AnimationOption {
  id: string;
  title: string;
  description: string;
  prompt: string;
  thumbnailUrl: string;
}

export interface GeneratedVideo {
  id: string;
  src: string;
  prompt: string;
  thumbnail?: string;
}

export type AspectRatio = "16:9" | "9:16";

export interface User {
    id: string | number;
    email: string;
}
