import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { ImageModule } from 'primeng/image';
import { ToastModule } from 'primeng/toast';
import { useWishlist } from '../../../hooks/wishlist.hooks';
import { useCart } from '../../../hooks/cart.hooks';
import { useAuth } from '../../../hooks/auth.hooks';
import { WishlistItem } from '../../../models/wishlist.model';
import { TopPageComponent } from '../../ui/top-page/top-page.component';
import { FilterComponent, FilterItem } from '../../ui/filter/filter.component';
import { QuantityControlsComponent } from '../../ui/quantity-controls/quantity-controls.component';
import { ProductService } from '../../../services/product.service';
import { Category, CategoryLabels, CategoryColors } from '../../../enums/category.enum';

@Component({
  selector: 'app-user-wishlist-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    InputNumberModule,
    ConfirmDialogModule,
    SkeletonModule,
    TagModule,
    ImageModule,
    ToastModule,
    TopPageComponent,
    FilterComponent,
    QuantityControlsComponent
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './user-wishlist-detail.component.html',
  styleUrl: './user-wishlist-detail.component.css'
})
export class UserWishlistDetailComponent implements OnInit {
  wishlist = useWishlist();
  cart = useCart();
  auth = useAuth();

  // Track quantity for adding to cart
  addToCartQuantities: { [productId: number]: number } = {};
  
  // Track if product details are being loaded
  isLoadingProductDetails = false;

  // Category filter
  categoryFilters: FilterItem[] = [];
  activeCategoryFilters: string[] = [];

  constructor(
    public router: Router,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private productService: ProductService
  ) {}

  async ngOnInit() {
    // Only load wishlist if user is authenticated and auth is fully initialized
    if (this.auth.isAuthenticated() && this.auth.isInitialized()) {
      try {
        // Initialize cart to check product status
        await this.cart.initializeCart();
        
        // Smart wishlist loading: only load from database if needed
        if (this.wishlist.shouldRefreshFromDatabase() && !this.wishlist.isLoading()) {
          // Wishlist is empty or stale, load from database
          await this.wishlist.loadWishlist();
        }
        
        // Load product details for wishlist items
        await this.loadProductDetails();
        
        // Initialize category filters
        this.initializeCategoryFilters();
        
      } catch (error) {
        console.error('Failed to load wishlist on component init:', error);
        // Component will show appropriate UI for empty/loading state
      }
      
      // Initialize add to cart quantities
      this.wishlist.wishlistItems().forEach(item => {
        this.addToCartQuantities[item.productId] = 1;
      });
    } else {
      // Redirect to login if not authenticated
      this.router.navigate(['/auth/login']);
    }
  }

  /**
   * Load product details for all wishlist items
   */
  private async loadProductDetails(): Promise<void> {
    const wishlistItems = this.wishlist.wishlistItems();
    if (wishlistItems.length === 0) {
      return;
    }

    this.isLoadingProductDetails = true;

    try {
      const productDetailsPromises = wishlistItems.map(async (item) => {
        try {
          const product = await this.productService.getProductById(item.productId);
          return { 
            productId: item.productId, 
            productName: product.name,
            productPrice: product.price,
            productImage: product.image || undefined,
            productCategory: product.category,
            productQuantity: product.quantity
          };
        } catch (error) {
          console.error(`Failed to load product details for ID ${item.productId}:`, error);
          return { 
            productId: item.productId,
            productName: 'Unknown Product',
            productPrice: 0,
            productImage: undefined,
            productCategory: '',
            productQuantity: 0
          };
        }
      });

      const productDetails = await Promise.all(productDetailsPromises);
      
      // Update wishlist store with product details
      this.wishlist.updateWishlistItemsWithProductData(productDetails);
    } catch (error) {
      console.error('Failed to load product details:', error);
    } finally {
      this.isLoadingProductDetails = false;
    }
  }

  /**
   * Initialize category filters from available products
   */
  private initializeCategoryFilters(): void {
    const categories = new Set<string>();
    
    this.wishlist.wishlistItems().forEach(item => {
      if (item.productCategory) {
        categories.add(item.productCategory);
      }
    });

    this.categoryFilters = Array.from(categories).map(category => ({
      key: category,
      label: this.formatCategoryLabel(category),
      selected: false,
      category: category as Category // Add category for coloring
    }));
  }

  /**
   * Format category label for display
   */
  formatCategoryLabel(category: string): string {
    const categoryKey = category as Category;
    return CategoryLabels[categoryKey] || category;
  }

  /**
   * Get category tag severity for coloring
   */
  getCategoryTagSeverity(category: string): "success" | "info" | "warning" | "danger" | "secondary" | "contrast" {
    const categoryKey = category as Category;
    const severity = CategoryColors[categoryKey];
    
    // Map to valid PrimeNG severity types
    switch (severity) {
      case 'info': return 'info';
      case 'success': return 'success';
      case 'warning': return 'warning';
      case 'secondary': return 'secondary';
      default: return 'secondary';
    }
  }

  /**
   * Handle category filter changes
   */
  onCategoryFilterChange(filters: FilterItem[]): void {
    this.activeCategoryFilters = filters
      .filter(filter => filter.selected)
      .map(filter => filter.key);
  }

  /**
   * Handle clear category filters
   */
  onClearCategoryFilters(): void {
    this.activeCategoryFilters = [];
  }

  /**
   * Get filtered wishlist items based on active filters
   */
  getFilteredWishlistItems(): WishlistItem[] {
    let items = this.wishlist.wishlistItems();

    // Apply category filter
    if (this.activeCategoryFilters.length > 0) {
      items = items.filter(item => 
        item.productCategory && this.activeCategoryFilters.includes(item.productCategory)
      );
    }

    return items;
  }

  /**
   * Get quantity for adding to cart
   */
  getAddToCartQuantity(productId: number): number {
    return this.addToCartQuantities[productId] || 1;
  }

  /**
   * Set quantity for adding to cart
   */
  setAddToCartQuantity(productId: number, quantity: number): void {
    const maxQuantity = this.getMaxQuantity({ productId } as WishlistItem);
    
    // Ensure quantity is at least 1 and not more than available stock (minus what's already in cart)
    this.addToCartQuantities[productId] = Math.max(1, Math.min(quantity, maxQuantity));
  }

  /**
   * Get maximum allowed quantity for a product (total stock - current in cart)
   */
  getMaxQuantity(item: WishlistItem): number {
    const totalStock = item.productQuantity || 999;
    const currentInCart = this.getCartQuantity(item.productId);
    const availableToAdd = totalStock - currentInCart;
    
    // Return at least 1 if there's any stock available, otherwise 0
    return Math.max(0, availableToAdd);
  }

  /**
   * Check if the quantity exceeds available stock
   */
  isQuantityExceedsStock(item: WishlistItem): boolean {
    const maxQuantity = this.getMaxQuantity(item);
    const currentQuantity = this.getAddToCartQuantity(item.productId);
    return currentQuantity > maxQuantity;
  }

  /**
   * Add wishlist item to cart
   */
  async addToCart(item: WishlistItem): Promise<void> {
    const quantity = this.getAddToCartQuantity(item.productId);
    
    // Check if quantity exceeds available stock
    if (this.isQuantityExceedsStock(item)) {
      this.messageService.add({
        severity: 'error',
        summary: 'Quantity Exceeded',
        detail: `Cannot add ${quantity} items. Only ${this.getMaxQuantity(item)} items available in stock.`
      });
      return;
    }

    try {
      const success = await this.cart.addToCart(item.productId, quantity);
      
      if (success) {
        // Show success message
        this.messageService.add({
          severity: 'success',
          summary: 'Added to Cart',
          detail: `${item.productName} added to cart`
        });

        // Reset quantity to 1
        this.addToCartQuantities[item.productId] = 1;
      }
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  }

  /**
   * Remove item from wishlist with confirmation
   */
  removeFromWishlist(item: WishlistItem): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to remove "${item.productName}" from your wishlist?`,
      header: 'Remove Item',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-text',
      rejectButtonStyleClass: 'p-button-text p-button-text',
      accept: async () => {
        await this.wishlist.removeFromWishlist(item.productId);
        
        // Remove from local quantities tracking
        delete this.addToCartQuantities[item.productId];
        
        // Update category filters if needed
        this.initializeCategoryFilters();
      }
    });
  }

  /**
   * Clear entire wishlist with confirmation
   */
  clearWishlist(): void {
    this.confirmationService.confirm({
      message: 'Are you sure you want to remove all items from your wishlist?',
      header: 'Clear Wishlist',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-text',
      rejectButtonStyleClass: 'p-button-text p-button-text',
      accept: async () => {
        await this.wishlist.clearWishlist();
        
        // Clear local quantities tracking
        this.addToCartQuantities = {};
        
        // Clear category filters
        this.categoryFilters = [];
        this.activeCategoryFilters = [];
      }
    });
  }

  /**
   * Navigate back to products
   */
  goToProducts(): void {
    this.router.navigate(['/products']);
  }

  /**
   * Format price for display
   */
  formatPrice(price: number | undefined): string {
    if (price === undefined || price === null) {
      return 'N/A';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  }

  /**
   * Get default image
   */
  getDefaultImage(): string {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
  }

  /**
   * Check if product is already in cart
   */
  isInCart(productId: number): boolean {
    return this.cart.cartItems().some(item => item.productId === productId);
  }

  /**
   * Get current quantity of product in cart
   */
  getCartQuantity(productId: number): number {
    const cartItem = this.cart.cartItems().find(item => item.productId === productId);
    return cartItem?.quantity || 0;
  }

  /**
   * Check if all available stock is already in cart
   */
  isAllInCart(item: WishlistItem): boolean {
    return this.getMaxQuantity(item) === 0;
  }
}
