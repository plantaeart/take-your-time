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
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { useCart } from '../../../hooks/cart.hooks';
import { useAuth } from '../../../hooks/auth.hooks';
import { CartItem } from '../../../models/cart.model';
import { TopPageComponent } from '../../ui/top-page/top-page.component';
import { ProductService } from '../../../services/product.service';

@Component({
  selector: 'app-user-cart-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    InputNumberModule,
    InputGroupModule,
    InputGroupAddonModule,
    ConfirmDialogModule,
    SkeletonModule,
    TagModule,
    ImageModule,
    ToastModule,
    TopPageComponent
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './user-cart-detail.component.html',
  styleUrl: './user-cart-detail.component.css'
})
export class UserCartDetailComponent implements OnInit {
  cart = useCart();
  auth = useAuth();

  // Track quantity updates for each item
  updateQuantities: { [productId: number]: number } = {};
  
  // Track if product details are being loaded
  isLoadingProductDetails = false;

  constructor(
    private router: Router,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private productService: ProductService
  ) {}

  async ngOnInit() {
    // Only load cart if user is authenticated and auth is fully initialized
    if (this.auth.isAuthenticated() && this.auth.isInitialized()) {
      try {
        // Smart cart loading: only load from database if needed
        if (this.cart.shouldRefreshFromDatabase() && !this.cart.isLoading()) {
          // Cart is empty or stale, load from database
          await this.cart.loadCart();
        }
        // If cart has fresh data, no need to reload
        
        // Load product details for quantity limits
        await this.loadProductDetails();
        
      } catch (error) {
        console.error('Failed to load cart on component init:', error);
        // Component will show appropriate UI for empty/loading state
      }
      
      // Always initialize update quantities with current cart quantities (whether loaded or cached)
      this.cart.cartItems().forEach(item => {
        this.updateQuantities[item.productId] = item.quantity;
      });
    } else {
      // Redirect to login if not authenticated
      this.router.navigate(['/auth/login']);
    }
  }

  /**
   * Load product details for all cart items to get quantity limits
   */
  private async loadProductDetails(): Promise<void> {
    const cartItems = this.cart.cartItems();
    if (cartItems.length === 0) {
      return;
    }

    this.isLoadingProductDetails = true;

    try {
      const productDetailsPromises = cartItems.map(async (item) => {
        try {
          const product = await this.productService.getProductById(item.productId);
          return { productId: item.productId, productQuantity: product.quantity };
        } catch (error) {
          console.error(`Failed to load product details for ID ${item.productId}:`, error);
          return { productId: item.productId, productQuantity: 0 };
        }
      });

      const productDetails = await Promise.all(productDetailsPromises);
      
      // Update cart store with product quantities
      this.cart.updateCartItemsWithProductData(productDetails);
    } catch (error) {
      console.error('Failed to load product details:', error);
    } finally {
      this.isLoadingProductDetails = false;
    }
  }

  /**
   * Get the maximum allowed quantity for a product
   */
  getMaxQuantity(item: CartItem): number {
    return item.productQuantity || 999; // Default to high number if not available
  }

  /**
   * Check if the quantity exceeds available stock
   */
  isQuantityExceedsStock(item: CartItem): boolean {
    const maxQuantity = this.getMaxQuantity(item);
    const currentQuantity = this.getUpdateQuantity(item.productId);
    return currentQuantity > maxQuantity;
  }

  /**
   * Get quantity for updates
   */
  getUpdateQuantity(productId: number): number {
    return this.updateQuantities[productId] || 1;
  }

  /**
   * Set quantity for updates (with validation)
   */
  setUpdateQuantity(productId: number, quantity: number): void {
    const item = this.cart.cartItems().find(item => item.productId === productId);
    const maxQuantity = item ? this.getMaxQuantity(item) : 999;
    
    // Ensure quantity is at least 1 and not more than available stock
    this.updateQuantities[productId] = Math.max(1, Math.min(quantity, maxQuantity));
  }

  /**
   * Update cart item quantity
   */
  async updateItemQuantity(item: CartItem): Promise<void> {
    const newQuantity = this.getUpdateQuantity(item.productId);
    
    // Check if quantity exceeds available stock
    if (this.isQuantityExceedsStock(item)) {
      this.messageService.add({
        severity: 'error',
        summary: 'Quantity Exceeded',
        detail: `Cannot add ${newQuantity} items. Only ${this.getMaxQuantity(item)} items available in stock.`
      });
      // Reset to current quantity
      this.updateQuantities[item.productId] = item.quantity;
      return;
    }
    
    if (newQuantity !== item.quantity) {
      try {
        const success = await this.cart.updateCartItem(item.productId, newQuantity);
        
        if (success) {
          // Update the local tracking quantity to match the new cart state
          this.updateQuantities[item.productId] = newQuantity;
          
          // Show success message for significant quantity changes
          if (Math.abs(newQuantity - item.quantity) > 1) {
            this.messageService.add({
              severity: 'success',
              summary: 'Quantity Updated',
              detail: `${item.productName} quantity updated to ${newQuantity}`
            });
          }
        } else {
          // Reset to current quantity on failure
          this.updateQuantities[item.productId] = item.quantity;
        }
      } catch (error) {
        console.error('Failed to update cart item quantity:', error);
        // Reset to previous quantity on error
        this.updateQuantities[item.productId] = item.quantity;
      }
    }
  }

  /**
   * Remove item from cart with confirmation
   */
  removeItem(item: CartItem): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to remove "${item.productName}" from your cart?`,
      header: 'Remove Item',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-text',
      rejectButtonStyleClass: 'p-button-text p-button-text',
      accept: async () => {
        await this.cart.removeFromCart(item.productId);
      }
    });
  }

  /**
   * Clear entire cart with confirmation
   */
  clearCart(): void {
    this.confirmationService.confirm({
      message: 'Are you sure you want to remove all items from your cart?',
      header: 'Clear Cart',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-text',
      rejectButtonStyleClass: 'p-button-text p-button-text',
      accept: async () => {
        await this.cart.clearCart();
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
   * Calculate total price
   */
  calculateTotal(): number {
    return this.cart.cartItems().reduce((total, item) => {
      return total + (item.productPrice || 0) * item.quantity;
    }, 0);
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
}
