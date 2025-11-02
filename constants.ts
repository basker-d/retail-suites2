import { AnimationOption } from './types';

export const ANIMATION_OPTIONS: AnimationOption[] = [
  {
    id: 'turntable',
    title: 'Turntable',
    description: 'A smooth, 360-degree rotation of the main subject.',
    prompt: 'A cinematic, high-quality video of the main subject rotating 360 degrees on a turntable, studio lighting, on a clean, reflective surface.',
    thumbnailUrl: 'https://picsum.photos/seed/turntable/300/200'
  },
  {
    id: 'gentle-fall',
    title: 'Gentle Fall',
    description: 'The product gently falls from the top onto a surface.',
    prompt: 'A cinematic, high-quality slow-motion video of the main subject gently falling from above and landing softly on a clean, white table.',
    thumbnailUrl: 'https://picsum.photos/seed/fall/300/200'
  },
  {
    id: 'magic-appear',
    title: 'Magic Appear',
    description: 'The product appears on a table with a magical sparkle.',
    prompt: 'A cinematic, high-quality video where the main subject magically appears on a table with a burst of sparkling, ethereal light particles.',
    thumbnailUrl: 'https://picsum.photos/seed/magic/300/200'
  },
  {
    id: 'water-splash',
    title: 'Water Splash',
    description: 'Refreshing water splashes around the product.',
    prompt: 'A cinematic, high-quality video of the product on a clean surface with refreshing, clear water splashing around it in slow motion, conveying a sense of coolness and cleanliness.',
    thumbnailUrl: 'https://picsum.photos/seed/water/300/200'
  },
];

export const LOADING_MESSAGES: string[] = [
  'Warming up the digital studio...',
  'Analyzing pixels and possibilities...',
  'Choreographing the animation...',
  'Rendering your high-quality ad...',
  'Adding the final sparkling touches...',
  'This can take a few minutes, hang tight!',
];