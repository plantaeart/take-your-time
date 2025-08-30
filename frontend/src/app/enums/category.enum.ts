export enum Category {
  ACCESSORIES = 'ACCESSORIES',
  FITNESS = 'FITNESS',
  CLOTHING = 'CLOTHING',
  ELECTRONICS = 'ELECTRONICS'
}

export const CategoryLabels: Record<Category, string> = {
  [Category.ACCESSORIES]: 'Accessories',
  [Category.FITNESS]: 'Fitness',
  [Category.CLOTHING]: 'Clothing',
  [Category.ELECTRONICS]: 'Electronics'
};

export type PrimeNGSeverity = 'success' | 'info' | 'warning' | 'danger' | 'secondary' | 'contrast';

export const CategoryColors: Record<Category, PrimeNGSeverity> = {
  [Category.ACCESSORIES]: 'info',
  [Category.FITNESS]: 'success',
  [Category.CLOTHING]: 'warning',
  [Category.ELECTRONICS]: 'secondary'
};

export const CategoryHexColors: Record<Category, string> = {
  [Category.ACCESSORIES]: '#3b82f6', // info - blue
  [Category.FITNESS]: '#10b981',      // success - green
  [Category.CLOTHING]: '#f59e0b',     // warning - amber
  [Category.ELECTRONICS]: '#1e40af'  // secondary - dark blue (matches PrimeNG secondary)
};

export const CategoryValues = Object.values(Category);
