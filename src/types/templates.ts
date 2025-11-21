export interface PromptTemplate {
  id: string;
  title: string;
  description: string;
  prompt: string;
  category: TemplateCategory;
  tags: string[];
}

export type TemplateCategory = "code" | "image" | "content" | "research" | "business";

export const TEMPLATE_CATEGORIES: Record<TemplateCategory, { label: string; icon: string }> = {
  code: { label: "Code Generation", icon: "Code" },
  image: { label: "Image Creation", icon: "Image" },
  content: { label: "Content Writing", icon: "FileText" },
  research: { label: "Research", icon: "Search" },
  business: { label: "Business", icon: "Briefcase" },
};

export const promptTemplates: PromptTemplate[] = [
  // Code Generation Templates
  {
    id: "react-component",
    title: "React Component",
    description: "Create a reusable React component",
    prompt: "Create a React component that handles user authentication with email and password",
    category: "code",
    tags: ["react", "component", "javascript"],
  },
  {
    id: "api-endpoint",
    title: "API Endpoint",
    description: "Build a REST API endpoint",
    prompt: "Create a REST API endpoint for user registration with email validation",
    category: "code",
    tags: ["api", "backend", "rest"],
  },
  {
    id: "database-schema",
    title: "Database Schema",
    description: "Design a database schema",
    prompt: "Design a database schema for an e-commerce platform with products, orders, and customers",
    category: "code",
    tags: ["database", "sql", "schema"],
  },
  {
    id: "algorithm",
    title: "Algorithm Solution",
    description: "Solve a coding problem",
    prompt: "Write an efficient algorithm to find the shortest path in a weighted graph",
    category: "code",
    tags: ["algorithm", "optimization", "data-structures"],
  },
  
  // Image Creation Templates
  {
    id: "hero-image",
    title: "Hero Image",
    description: "Create a stunning hero section image",
    prompt: "Create a modern hero image with abstract geometric shapes in blue and purple gradients for a tech startup landing page",
    category: "image",
    tags: ["hero", "landing", "abstract"],
  },
  {
    id: "product-mockup",
    title: "Product Mockup",
    description: "Generate product visualization",
    prompt: "Create a professional product mockup of a mobile app displayed on an iPhone in a minimalist office setting",
    category: "image",
    tags: ["mockup", "product", "professional"],
  },
  {
    id: "illustration",
    title: "Custom Illustration",
    description: "Design a unique illustration",
    prompt: "Design a flat-style illustration showing a team collaboration scene with diverse characters working together on a project",
    category: "image",
    tags: ["illustration", "team", "flat-design"],
  },
  {
    id: "social-media",
    title: "Social Media Post",
    description: "Create engaging social content",
    prompt: "Create an eye-catching Instagram post image about productivity tips with vibrant colors and modern typography",
    category: "image",
    tags: ["social-media", "instagram", "marketing"],
  },
  
  // Content Writing Templates
  {
    id: "blog-post",
    title: "Blog Post",
    description: "Write an engaging blog article",
    prompt: "Write a comprehensive blog post about the benefits of remote work for software developers, including statistics and real-world examples",
    category: "content",
    tags: ["blog", "article", "writing"],
  },
  {
    id: "product-description",
    title: "Product Description",
    description: "Craft compelling product copy",
    prompt: "Write a persuasive product description for a smart fitness tracker that monitors heart rate, sleep, and daily activity",
    category: "content",
    tags: ["product", "copywriting", "marketing"],
  },
  {
    id: "email-campaign",
    title: "Email Campaign",
    description: "Design an email sequence",
    prompt: "Create a welcome email sequence for new subscribers of a productivity app, including 3 emails with clear calls-to-action",
    category: "content",
    tags: ["email", "marketing", "campaign"],
  },
  {
    id: "social-caption",
    title: "Social Media Caption",
    description: "Write engaging captions",
    prompt: "Write 5 creative Instagram captions for a sustainable fashion brand launching a new collection",
    category: "content",
    tags: ["social-media", "captions", "branding"],
  },
  
  // Research Templates
  {
    id: "market-analysis",
    title: "Market Analysis",
    description: "Research market trends",
    prompt: "Analyze the current trends in AI-powered productivity tools, including key players, market size, and growth projections",
    category: "research",
    tags: ["market", "analysis", "trends"],
  },
  {
    id: "competitor-research",
    title: "Competitor Research",
    description: "Study competitor strategies",
    prompt: "Research the top 5 competitors in the project management software space, analyzing their features, pricing, and market positioning",
    category: "research",
    tags: ["competitors", "strategy", "business"],
  },
  {
    id: "literature-review",
    title: "Literature Review",
    description: "Summarize academic research",
    prompt: "Provide a comprehensive literature review on the impact of machine learning in healthcare diagnostics",
    category: "research",
    tags: ["academic", "literature", "summary"],
  },
  
  // Business Templates
  {
    id: "business-plan",
    title: "Business Plan",
    description: "Draft a business plan section",
    prompt: "Create an executive summary for a SaaS startup that provides AI-powered customer support automation",
    category: "business",
    tags: ["business-plan", "startup", "strategy"],
  },
  {
    id: "pitch-deck",
    title: "Pitch Deck Content",
    description: "Write pitch deck slides",
    prompt: "Write content for a 10-slide pitch deck for a mobile app that connects freelancers with local businesses",
    category: "business",
    tags: ["pitch", "presentation", "fundraising"],
  },
  {
    id: "value-proposition",
    title: "Value Proposition",
    description: "Define your unique value",
    prompt: "Create a compelling value proposition for an eco-friendly meal delivery service targeting busy professionals",
    category: "business",
    tags: ["value-prop", "marketing", "positioning"],
  },
];
