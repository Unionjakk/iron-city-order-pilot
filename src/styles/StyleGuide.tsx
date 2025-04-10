
/**
 * Iron City Shopify Style Guide
 * 
 * This document outlines the styling standards for the Iron City Shopify application.
 * All new pages and components should follow these guidelines.
 */

/**
 * COLORS
 * 
 * Primary: Orange - Used for headings, buttons, links, and accents
 * Background: Black to dark zinc - Used for page backgrounds
 * Text: White to light zinc - Used for body text
 * Secondary Background: Dark zinc - Used for cards and panels
 * Border: Dark zinc - Used for separators and borders
 */

/**
 * LAYOUT
 * 
 * - Every page should use the main AdminLayout component for consistency
 * - Content should be wrapped in "container mx-auto px-4" for proper spacing
 * - All pages should have the same max-width behavior
 * - Section titles should use "text-2xl font-bold text-orange-500" class
 * - Section descriptions should use "text-orange-400/80" class
 * - Cards should use "border-zinc-800 bg-zinc-900/60 backdrop-blur-sm" for consistent styling
 */

/**
 * TYPOGRAPHY
 * 
 * - Headings: text-orange-500, with appropriate text-{size} classes
 * - Body text: text-zinc-300 for primary content
 * - Secondary text: text-zinc-400 for less important information
 * - Card titles: text-orange-500 font-medium
 * - Card descriptions: text-zinc-400
 */

/**
 * COMPONENTS
 * 
 * - Cards should use the shadcn/ui Card component with consistent styling
 * - Buttons should use the shadcn/ui Button component with appropriate variants
 * - Links should be text-orange-500 hover:text-orange-400
 * - Icons should be from lucide-react, sized appropriately to the context
 */

export const StyleGuide = {
  colors: {
    primary: "text-orange-500",
    primaryHover: "hover:text-orange-400",
    background: "bg-black",
    backgroundGradient: "bg-gradient-to-br from-black to-zinc-900",
    card: "bg-zinc-900/60 backdrop-blur-sm",
    cardBorder: "border-zinc-800",
    text: "text-zinc-300",
    textSecondary: "text-zinc-400",
    textMuted: "text-zinc-500"
  },
  
  layout: {
    container: "container mx-auto px-4",
    pageTitle: "text-2xl font-bold text-orange-500",
    pageDescription: "text-orange-400/80",
    section: "space-y-6",
    card: "border-zinc-800 bg-zinc-900/60 backdrop-blur-sm",
  },
  
  components: {
    button: {
      primary: "bg-orange-500 hover:bg-orange-600 text-white",
      secondary: "bg-zinc-800 hover:bg-zinc-700 text-orange-400",
      outline: "border-zinc-700 text-orange-400 hover:bg-zinc-800 hover:text-orange-300"
    },
    link: "text-orange-500 hover:text-orange-400",
    iconButton: "text-orange-400 hover:bg-zinc-800 hover:text-orange-300"
  }
};

export default StyleGuide;
