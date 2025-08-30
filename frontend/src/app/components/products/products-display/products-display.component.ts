import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ImageModule } from 'primeng/image';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { InputNumberModule } from 'primeng/inputnumber';
import { useProductList, useProductFilters } from '../../../hooks/product.hooks';
import { useCart } from '../../../hooks/cart.hooks';
import { useAuth } from '../../../hooks/auth.hooks';
import { useWishlist } from '../../../hooks/wishlist.hooks';
import { Product } from '../../../models/product.model';
import { InventoryStatus } from '../../../enums/inventory-status.enum';
import { Category, CategoryLabels, CategoryColors } from '../../../enums/category.enum';
import { TopPageComponent } from '../../ui/top-page/top-page.component';
import { FilterComponent, FilterItem, FilterConfig, FilterChangeEvent } from '../../ui/filter/filter.component';

type TagSeverity = "success" | "warning" | "danger" | "info" | "secondary" | "contrast";

@Component({
  selector: 'app-products-display',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    TagModule,
    ImageModule,
    SkeletonModule,
    TooltipModule,
    InputNumberModule,
    TopPageComponent,
    FilterComponent
  ],
  templateUrl: './products-display.component.html',
  styleUrl: './products-display.component.css'
})
export class ProductsDisplayComponent implements OnInit {
  productList = useProductList();
  productFilters = useProductFilters();
  cart = useCart();
  auth = useAuth();
  wishlist = useWishlist();
  
  // Track quantities to add for each product
  addQuantities: { [productId: number]: number } = {};
  
  // Legacy category filters for backward compatibility
  categoryFilters = signal<FilterItem[]>([]);
  
  // Filter configuration for the comprehensive filter component
  filterConfig: FilterConfig = {
    showCategories: true,
    showInventoryStatus: true,
    showPriceRange: true,
    showSorting: true
    // priceMin and priceMax will be set dynamically by the filter component
  };
  
  // Default product image (simple placeholder)
  readonly defaultImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';

  async ngOnInit() {
    await this.productList.initialize();
    // Products loaded successfully
    // Initialize wishlist to check product states
    await this.wishlist.initializeWishlist();
    // Cart will be loaded automatically when user first tries to add an item
    
    // Initialize category filters
    this.initializeCategoryFilters();
  }

  /**
   * Initialize category filters from available categories
   */
  private initializeCategoryFilters(): void {
    const categories = Object.values(Category);
    this.categoryFilters.set(
      categories.map(category => ({
        key: category,
        label: CategoryLabels[category],
        selected: false,
        category: category
      }))
    );
  }

  /**
   * Handle comprehensive filter changes (new system)
   */
  onFiltersChange(filterEvent: FilterChangeEvent): void {
    // Apply category filter
    if (filterEvent.categories && filterEvent.categories.length > 0) {
      // For now, apply the first selected category (single category filtering)
      // Future enhancement: support multiple categories
      this.productFilters.setCategory(filterEvent.categories[0] as Category);
    } else {
      this.productFilters.setCategory(undefined);
    }

    // Apply inventory status filter
    if (filterEvent.inventoryStatuses && filterEvent.inventoryStatuses.length > 0) {
      // For now, apply the first selected status (single status filtering)
      // Future enhancement: support multiple statuses
      this.productFilters.setInventoryStatus(filterEvent.inventoryStatuses[0] as InventoryStatus);
    } else {
      this.productFilters.setInventoryStatus(undefined);
    }

    // Apply price range filter
    if (filterEvent.priceRange) {
      this.productFilters.setFilters({
        priceMin: filterEvent.priceRange.min || undefined,
        priceMax: filterEvent.priceRange.max || undefined
      });
    } else {
      // Clear price range when no filter
      this.productFilters.setFilters({
        priceMin: undefined,
        priceMax: undefined
      });
    }

    // Apply sorting - always set sorting parameters (even when cleared)
    this.productFilters.setFilters({
      sortBy: filterEvent.sortBy as any,
      sortOrder: filterEvent.sortOrder
    });
  }

  /**
   * Handle category filter changes (legacy support)
   */
  onCategoryFilterChange(filters: FilterItem[]): void {
    const selectedCategories = filters
      .filter(filter => filter.selected)
      .map(filter => filter.key as Category);
    
    // If no categories selected, show all products
    if (selectedCategories.length === 0) {
      this.productFilters.setCategory(undefined);
    } else if (selectedCategories.length === 1) {
      // If one category selected, filter by that category
      this.productFilters.setCategory(selectedCategories[0]);
    } else {
      // If multiple categories selected, we need to clear the single category filter
      // and implement multi-category filtering (for future enhancement)
      this.productFilters.setCategory(undefined);
    }
  }

  /**
   * Handle clear filters
   */
  onClearFilters(): void {
    // Clear all applied filters
    this.productFilters.clearFilters();
  }

  /**
   * Get quantity to add for a product
   */
  getAddQuantity(productId: number): number {
    return this.addQuantities[productId] || 1;
  }

  /**
   * Set quantity to add for a product
   */
  setAddQuantity(productId: number, quantity: number): void {
    this.addQuantities[productId] = Math.max(1, quantity);
  }

  /**
   * Check if product can be added to cart
   */
  canAddToCart(product: Product): boolean {
    return product.quantity > 0 && product.inventoryStatus !== InventoryStatus.OUTOFSTOCK;
  }

  /**
   * Get maximum quantity that can be added to cart
   */
  getMaxAddQuantity(product: Product): number {
    if (!product.id) return 0;
    const currentInCart = this.cart.getProductQuantityInCart(product.id);
    return Math.max(0, product.quantity - currentInCart);
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
   * Handle add to cart button click
   */
  async onAddToCart(product: Product) {
    if (!product.id || !this.canAddToCart(product)) {
      return;
    }

    const quantity = this.getAddQuantity(product.id);
    const maxQuantity = this.getMaxAddQuantity(product);
    
    if (quantity > maxQuantity) {
      // Reset to maximum available
      this.setAddQuantity(product.id, maxQuantity);
      return;
    }

    const success = await this.cart.addToCart(product.id, quantity);
    if (success) {
      // Reset quantity selector to 1 after successful add
      this.setAddQuantity(product.id, 1);
    }
  }

  /**
   * Check if product is in wishlist
   */
  isInWishlist(product: Product): boolean {
    if (!product.id) return false;
    return this.wishlist.isProductInWishlist(product.id);
  }

  /**
   * Handle add to wishlist button click
   */
  async onAddToWishlist(product: Product) {
    if (!product.id) return;

    if (this.isInWishlist(product)) {
      // Remove from wishlist
      await this.wishlist.removeFromWishlist(product.id);
    } else {
      // Add to wishlist
      await this.wishlist.addToWishlist(product.id);
    }
  }

  /**
   * Handle show more button click
   */
  async onShowMore() {
    await this.productList.loadMore();
  }
}
