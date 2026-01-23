// Mock Category and SubCategory API
// This file simulates API responses for categories and sub-categories

export interface Category {
  id: string;
  name: string;
  description: string;
}

export interface SubCategory {
  id: string;
  name: string;
  categoryId: string;
}

// Mock categories data
const mockCategories: Category[] = [
  { id: "cat_1", name: "Camping", description: "Camping equipment and gear" },
  { id: "cat_2", name: "Hiking", description: "Hiking and trekking gear" },
  { id: "cat_3", name: "Climbing", description: "Rock climbing and mountaineering equipment" },
  { id: "cat_4", name: "Water Sports", description: "Water sports and aquatic gear" },
  { id: "cat_5", name: "Winter Sports", description: "Skiing, snowboarding and winter gear" },
];

// Mock sub-categories data mapped to categories
const mockSubCategories: SubCategory[] = [
  // Camping
  { id: "sub_1", name: "Tents", categoryId: "cat_1" },
  { id: "sub_2", name: "Sleeping Bags", categoryId: "cat_1" },
  { id: "sub_3", name: "Cooking Gear", categoryId: "cat_1" },
  { id: "sub_4", name: "Backpacks", categoryId: "cat_1" },
  { id: "sub_5", name: "Camping Furniture", categoryId: "cat_1" },
  
  // Hiking
  { id: "sub_6", name: "Boots", categoryId: "cat_2" },
  { id: "sub_7", name: "Trekking Poles", categoryId: "cat_2" },
  { id: "sub_8", name: "GPS Devices", categoryId: "cat_2" },
  { id: "sub_9", name: "Hydration Packs", categoryId: "cat_2" },
  { id: "sub_10", name: "Hiking Backpacks", categoryId: "cat_2" },
  
  // Climbing
  { id: "sub_11", name: "Ropes", categoryId: "cat_3" },
  { id: "sub_12", name: "Harnesses", categoryId: "cat_3" },
  { id: "sub_13", name: "Carabiners", categoryId: "cat_3" },
  { id: "sub_14", name: "Helmets", categoryId: "cat_3" },
  { id: "sub_15", name: "Climbing Shoes", categoryId: "cat_3" },
  
  // Water Sports
  { id: "sub_16", name: "Kayaks", categoryId: "cat_4" },
  { id: "sub_17", name: "Paddleboards", categoryId: "cat_4" },
  { id: "sub_18", name: "Life Jackets", categoryId: "cat_4" },
  { id: "sub_19", name: "Wet Suits", categoryId: "cat_4" },
  { id: "sub_20", name: "Snorkeling Gear", categoryId: "cat_4" },
  
  // Winter Sports
  { id: "sub_21", name: "Skis", categoryId: "cat_5" },
  { id: "sub_22", name: "Snowboards", categoryId: "cat_5" },
  { id: "sub_23", name: "Ski Boots", categoryId: "cat_5" },
  { id: "sub_24", name: "Poles", categoryId: "cat_5" },
  { id: "sub_25", name: "Snow Jackets", categoryId: "cat_5" },
];

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Mock API to fetch all categories
 */
export const fetchCategories = async (): Promise<Category[]> => {
  await delay(300); // Simulate network delay
  return [...mockCategories];
};

/**
 * Mock API to fetch sub-categories by category ID
 */
export const fetchSubCategoriesByCategoryId = async (categoryId: string): Promise<SubCategory[]> => {
  await delay(200); // Simulate network delay
  return mockSubCategories.filter(sub => sub.categoryId === categoryId);
};

/**
 * Mock API to fetch all sub-categories
 */
export const fetchAllSubCategories = async (): Promise<SubCategory[]> => {
  await delay(300); // Simulate network delay
  return [...mockSubCategories];
};

/**
 * Get category by ID
 */
export const getCategoryById = async (id: string): Promise<Category | undefined> => {
  await delay(100);
  return mockCategories.find(cat => cat.id === id);
};

/**
 * Get sub-category by ID
 */
export const getSubCategoryById = async (id: string): Promise<SubCategory | undefined> => {
  await delay(100);
  return mockSubCategories.find(sub => sub.id === id);
};
