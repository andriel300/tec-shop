export type EnhancementEffect =
  | 'aiRemoveBackground'
  | 'aiDropShadow'
  | 'aiRetouch'
  | 'aiUpscale';

export const enhancements: { label: string; effect: EnhancementEffect }[] = [
  { label: 'Remove BG', effect: 'aiRemoveBackground' },
  { label: 'Drop Shadow', effect: 'aiDropShadow' },
  { label: 'Retouch', effect: 'aiRetouch' },
  { label: 'Upscale', effect: 'aiUpscale' },
];

export const effectToUrlParam: Record<EnhancementEffect, string> = {
  aiRemoveBackground: 'bgremove',
  aiDropShadow: 'dropshadow',
  aiRetouch: 'retouch',
  aiUpscale: 'upscale',
};
