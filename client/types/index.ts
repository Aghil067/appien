import { LucideIcon } from 'lucide-react';

export interface Answer {
  text: string;
  responderId: string;
  responderName: string;
  createdAt: string;
}

export interface Question {
  _id: string;
  text: string;
  askerId: string;
  location: {
    coordinates: number[];
  };
  answers: Answer[];
  createdAt: string;
  expiresAt: string;
}

export interface Prompt {
  text: string;
  icon: LucideIcon;
  color: string;
}