import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { ImageModule } from 'primeng/image';
import { useCart } from '../../../hooks/cart.hooks';
import { useAuth } from '../../../hooks/auth.hooks';
import { CartItem } from '../../../models/cart.model';
import { TopPageComponent } from '../../ui/top-page/top-page.component';

@Component({
  selector: 'app-user-cart-detail',
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
    TopPageComponent
  ],
  providers: [ConfirmationService],
  templateUrl: './user-cart-detail.component.html',
  styleUrl: './user-cart-detail.component.css'
})
export class UserCartDetailComponent implements OnInit {
  cart = useCart();
  auth = useAuth();

  // Track quantity updates for each item
  updateQuantities: { [productId: number]: number } = {};

  constructor(
    private router: Router,
    private confirmationService: ConfirmationService
  ) {}

  async ngOnInit() {
    // Only load cart if user is authenticated
    if (this.auth.isAuthenticated()) {
      // Explicitly load cart when user visits cart page
      await this.cart.loadCart();
      
      // Initialize update quantities with current cart quantities
      this.cart.cartItems().forEach(item => {
        this.updateQuantities[item.productId] = item.quantity;
      });
    } else {
      // Redirect to login if not authenticated
      this.router.navigate(['/auth/login']);
    }
  }

  /**
   * Get quantity for updates
   */
  getUpdateQuantity(productId: number): number {
    return this.updateQuantities[productId] || 1;
  }

  /**
   * Set quantity for updates
   */
  setUpdateQuantity(productId: number, quantity: number): void {
    this.updateQuantities[productId] = Math.max(1, quantity);
  }

  /**
   * Update cart item quantity
   */
  async updateItemQuantity(item: CartItem): Promise<void> {
    const newQuantity = this.getUpdateQuantity(item.productId);
    if (newQuantity !== item.quantity) {
      await this.cart.updateCartItem(item.productId, newQuantity);
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
