import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ImageModule } from 'primeng/image';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { useProductList } from '../../hooks/product.hooks';
import { Product } from '../../models/product.model';
import { InventoryStatus } from '../../enums/inventory-status.enum';
import { Category, CategoryLabels, CategoryColors } from '../../enums/category.enum';

type TagSeverity = "success" | "warning" | "danger" | "info" | "secondary" | "contrast";

@Component({
  selector: 'app-products-display',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    TagModule,
    ImageModule,
    SkeletonModule,
    TooltipModule
  ],
  templateUrl: './products-display.component.html',
  styleUrl: './products-display.component.css'
})
export class ProductsDisplayComponent implements OnInit {
  productList = useProductList();
  
  // Default product image (simple placeholder)
  readonly defaultImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';

  async ngOnInit() {
    await this.productList.initialize();
  }

  /**
   * Get stock status configuration for PrimeNG tag
   */
  getStockConfig(status: InventoryStatus): { severity: TagSeverity; label: string } {
    switch (status) {
      case InventoryStatus.INSTOCK:
        return { severity: 'success', label: 'In Stock' };
      case InventoryStatus.LOWSTOCK:
        return { severity: 'warning', label: 'Low Stock' };
      case InventoryStatus.OUTOFSTOCK:
        return { severity: 'danger', label: 'Out of Stock' };
      default:
        return { severity: 'info', label: 'Unknown' };
    }
  }

  /**
   * Get category configuration for PrimeNG tag
   */
  getCategoryConfig(category: Category): { severity: TagSeverity; label: string } {
    return {
      severity: CategoryColors[category] as TagSeverity,
      label: CategoryLabels[category]
    };
  }

  /**
   * Format price for display
   */
  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  }

  /**
   * Handle image error
   */
  onImageError(event: Event) {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = this.defaultImage;
    }
  }

  /**
   * Handle add to cart button click
   */
  onAddToCart(product: Product) {
    console.log('Add to cart:', product.name);
    // TODO: Implement cart functionality
  }

  /**
   * Handle add to wishlist button click
   */
  onAddToWishlist(product: Product) {
    console.log('Add to wishlist:', product.name);
    // TODO: Implement wishlist functionality
  }

  /**
   * Handle show more button click
   */
  async onShowMore() {
    await this.productList.loadMore();
  }
}
