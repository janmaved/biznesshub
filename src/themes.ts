// Visual theme engine for storefronts.
// Each theme key maps to a palette + style preset that visibly changes the
// look (colours, fonts, hero shape, card style, button radius, layout flavour).
// The owner's custom primary/accent colours override the palette when set,
// but the structural look still changes per theme.

export interface ThemeStyle {
  primary: string;
  accent: string;
  bg: string;        // page background
  surface: string;   // card background
  text: string;      // main text colour
  muted: string;     // muted text
  font: string;      // google font family name (loaded via link)
  fontUrl: string;   // google fonts href
  radius: string;    // border radius for cards/buttons e.g. '1rem'
  heroShape: 'gradient' | 'split' | 'dark' | 'image' | 'minimal' | 'wave';
  cardStyle: 'shadow' | 'border' | 'flat' | 'glass';
  uppercaseHeads: boolean;
  // Structural layout of the product section — makes each theme look like a
  // different template (not just recoloured): grid, list, magazine, masonry…
  layout?: 'grid' | 'list' | 'magazine' | 'masonry' | 'showcase' | 'compact';
  // Product image aspect ratio for the card media.
  ratio?: 'square' | 'portrait' | 'landscape' | 'wide';
}

const FONTS = {
  poppins: { font: "'Poppins', sans-serif", url: 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;800&display=swap' },
  playfair: { font: "'Playfair Display', serif", url: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700;800&family=Inter:wght@400;600&display=swap' },
  inter: { font: "'Inter', sans-serif", url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap' },
  montserrat: { font: "'Montserrat', sans-serif", url: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;800&display=swap' },
  dmserif: { font: "'DM Serif Display', serif", url: 'https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Inter:wght@400;600&display=swap' },
  quicksand: { font: "'Quicksand', sans-serif", url: 'https://fonts.googleapis.com/css2?family=Quicksand:wght@400;600;700&display=swap' },
  spacegrotesk: { font: "'Space Grotesk', sans-serif", url: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&display=swap' },
};

export const THEME_STYLES: Record<string, ThemeStyle> = {
  // Restaurant
  aurora:     { primary: '#e11d48', accent: '#f59e0b', bg: '#fff7ed', surface: '#ffffff', text: '#1f2937', muted: '#6b7280', ...FONTS.poppins, radius: '1rem', heroShape: 'gradient', cardStyle: 'shadow', uppercaseHeads: false, layout: 'magazine', ratio: 'landscape' },
  bistro:     { primary: '#b45309', accent: '#fbbf24', bg: '#1c1917', surface: '#292524', text: '#f5f5f4', muted: '#a8a29e', ...FONTS.playfair, radius: '0.4rem', heroShape: 'dark', cardStyle: 'border', uppercaseHeads: true, layout: 'list', ratio: 'square' },
  fresco:     { primary: '#16a34a', accent: '#84cc16', bg: '#f0fdf4', surface: '#ffffff', text: '#14532d', muted: '#4d7c5a', ...FONTS.quicksand, radius: '1.4rem', heroShape: 'split', cardStyle: 'flat', uppercaseHeads: false, layout: 'grid', ratio: 'square' },
  royale:     { primary: '#7c3aed', accent: '#c084fc', bg: '#faf5ff', surface: '#ffffff', text: '#3b0764', muted: '#7e57a0', ...FONTS.dmserif, radius: '0.75rem', heroShape: 'gradient', cardStyle: 'shadow', uppercaseHeads: true, layout: 'showcase', ratio: 'portrait' },
  streeteats: { primary: '#ea580c', accent: '#facc15', bg: '#fffbeb', surface: '#ffffff', text: '#7c2d12', muted: '#9a6a4a', ...FONTS.montserrat, radius: '1.25rem', heroShape: 'wave', cardStyle: 'shadow', uppercaseHeads: true, layout: 'compact', ratio: 'square' },
  // Retail
  shopwave:   { primary: '#2563eb', accent: '#06b6d4', bg: '#f8fafc', surface: '#ffffff', text: '#0f172a', muted: '#64748b', ...FONTS.inter, radius: '0.75rem', heroShape: 'split', cardStyle: 'shadow', uppercaseHeads: false, layout: 'grid', ratio: 'portrait' },
  marketly:   { primary: '#0891b2', accent: '#22d3ee', bg: '#ecfeff', surface: '#ffffff', text: '#0e4f5c', muted: '#5b8a93', ...FONTS.poppins, radius: '1rem', heroShape: 'gradient', cardStyle: 'flat', uppercaseHeads: false, layout: 'compact', ratio: 'square' },
  luxe:       { primary: '#1f2937', accent: '#a16207', bg: '#fafaf9', surface: '#ffffff', text: '#1c1917', muted: '#78716c', ...FONTS.playfair, radius: '0.25rem', heroShape: 'minimal', cardStyle: 'border', uppercaseHeads: true, layout: 'showcase', ratio: 'portrait' },
  vibrant:    { primary: '#db2777', accent: '#f97316', bg: '#fff1f2', surface: '#ffffff', text: '#831843', muted: '#a4577a', ...FONTS.quicksand, radius: '1.5rem', heroShape: 'gradient', cardStyle: 'shadow', uppercaseHeads: false, layout: 'masonry', ratio: 'portrait' },
  noir:       { primary: '#f3f4f6', accent: '#a3a3a3', bg: '#0a0a0a', surface: '#171717', text: '#fafafa', muted: '#a3a3a3', ...FONTS.spacegrotesk, radius: '0.4rem', heroShape: 'dark', cardStyle: 'border', uppercaseHeads: true, layout: 'magazine', ratio: 'wide' },
  // Salon / Beauty
  glow:       { primary: '#db2777', accent: '#f9a8d4', bg: '#fdf2f8', surface: '#ffffff', text: '#831843', muted: '#b06a8f', ...FONTS.poppins, radius: '1.5rem', heroShape: 'gradient', cardStyle: 'shadow', uppercaseHeads: false, layout: 'showcase', ratio: 'portrait' },
  blush:      { primary: '#f43f5e', accent: '#fda4af', bg: '#fff1f2', surface: '#ffffff', text: '#881337', muted: '#b06a7a', ...FONTS.quicksand, radius: '1.75rem', heroShape: 'split', cardStyle: 'flat', uppercaseHeads: false, layout: 'masonry', ratio: 'portrait' },
  velvet:     { primary: '#9333ea', accent: '#d8b4fe', bg: '#1a1025', surface: '#2a1a3a', text: '#f5f3ff', muted: '#b8a8d0', ...FONTS.dmserif, radius: '1rem', heroShape: 'dark', cardStyle: 'glass', uppercaseHeads: true, layout: 'magazine', ratio: 'landscape' },
  serene:     { primary: '#14b8a6', accent: '#5eead4', bg: '#f0fdfa', surface: '#ffffff', text: '#134e4a', muted: '#5a8a86', ...FONTS.quicksand, radius: '1.5rem', heroShape: 'minimal', cardStyle: 'flat', uppercaseHeads: false, layout: 'list', ratio: 'landscape' },
  // Services
  prolaunch:  { primary: '#4f46e5', accent: '#06b6d4', bg: '#f8fafc', surface: '#ffffff', text: '#1e1b4b', muted: '#64748b', ...FONTS.inter, radius: '0.75rem', heroShape: 'split', cardStyle: 'shadow', uppercaseHeads: false, layout: 'list', ratio: 'landscape' },
  consult:    { primary: '#0284c7', accent: '#38bdf8', bg: '#f0f9ff', surface: '#ffffff', text: '#0c4a6e', muted: '#5a7d93', ...FONTS.inter, radius: '0.5rem', heroShape: 'minimal', cardStyle: 'border', uppercaseHeads: false, layout: 'list', ratio: 'landscape' },
  agency:     { primary: '#7c3aed', accent: '#ec4899', bg: '#0f0f17', surface: '#1a1a26', text: '#f5f5f7', muted: '#a0a0b0', ...FONTS.spacegrotesk, radius: '1rem', heroShape: 'dark', cardStyle: 'glass', uppercaseHeads: true, layout: 'magazine', ratio: 'wide' },
  craft:      { primary: '#ca8a04', accent: '#d97706', bg: '#fefce8', surface: '#ffffff', text: '#713f12', muted: '#92722f', ...FONTS.playfair, radius: '0.6rem', heroShape: 'split', cardStyle: 'border', uppercaseHeads: false, layout: 'masonry', ratio: 'portrait' },
  // General
  minimal:    { primary: '#334155', accent: '#64748b', bg: '#ffffff', surface: '#f8fafc', text: '#0f172a', muted: '#64748b', ...FONTS.inter, radius: '0.5rem', heroShape: 'minimal', cardStyle: 'border', uppercaseHeads: false, layout: 'grid', ratio: 'square' },
  spark:      { primary: '#0d9488', accent: '#f59e0b', bg: '#f0fdfa', surface: '#ffffff', text: '#134e4a', muted: '#5a8a86', ...FONTS.poppins, radius: '1rem', heroShape: 'gradient', cardStyle: 'shadow', uppercaseHeads: false, layout: 'compact', ratio: 'square' },
  prism:      { primary: '#8b5cf6', accent: '#ec4899', bg: '#faf5ff', surface: '#ffffff', text: '#4c1d95', muted: '#7c6a9c', ...FONTS.spacegrotesk, radius: '1.25rem', heroShape: 'gradient', cardStyle: 'glass', uppercaseHeads: false, layout: 'showcase', ratio: 'portrait' },
};

export function getThemeStyle(key: string): ThemeStyle {
  return THEME_STYLES[key] || THEME_STYLES.minimal;
}
