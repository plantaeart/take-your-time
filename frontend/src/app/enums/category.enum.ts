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

export const CategoryColors: Record<Category, string> = {
  [Category.ACCESSORIES]: 'info',
  [Category.FITNESS]: 'success',
  [Category.CLOTHING]: 'warning',
  [Category.ELECTRONICS]: 'secondary'
};

export const CategoryValues = Object.values(Category);
