export enum InventoryStatus {
  INSTOCK = 'INSTOCK',
  LOWSTOCK = 'LOWSTOCK',
  OUTOFSTOCK = 'OUTOFSTOCK'
}

export const InventoryStatusLabels: Record<InventoryStatus, string> = {
  [InventoryStatus.INSTOCK]: 'In Stock',
  [InventoryStatus.LOWSTOCK]: 'Low Stock',
  [InventoryStatus.OUTOFSTOCK]: 'Out of Stock'
};

export const InventoryStatusValues = Object.values(InventoryStatus);

export const InventoryStatusColors: Record<InventoryStatus, string> = {
  [InventoryStatus.INSTOCK]: '#4CAF50', // Green
  [InventoryStatus.LOWSTOCK]: '#FF9800', // Orange
  [InventoryStatus.OUTOFSTOCK]: '#F44336' // Red
};
