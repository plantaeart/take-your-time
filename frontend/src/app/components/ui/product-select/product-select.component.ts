import { Component, input, output, signal, computed, effect, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { Product } from '../../../models/product.model';
import { InventoryStatus } from '../../../enums/inventory-status.enum';
import { useAdminProductSearch } from '../../../hooks/admin-search.hooks';

@Component({
  selector: 'app-product-select',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DropdownModule
  ],
  templateUrl: './product-select.component.html',
  styleUrl: './product-select.component.css'
})
export class ProductSelectComponent implements OnDestroy {
  // Hooks
  productSearch = useAdminProductSearch();

  // Inputs
  selectedProduct = input<Product | null>(null);
  excludeProductIds = input<number[]>([]); // Products already in user's cart
  placeholder = input<string>('Select a Product');
  disabled = input<boolean>(false);

  // Outputs
  productChange = output<Product | null>();

  // Internal state
  internalSelection = signal<Product | null>(null);
  searchTerm = signal<string>('');
  searchTimeout: number | null = null;

  // Available products (filtered for stock > 0 and not excluded)
  availableProducts = computed(() => {
    const searchState = this.productSearch.state();
    const products = searchState.items || [];
    const excludeIds = this.excludeProductIds();
    
    return products.filter((product: Product) => 
      product.quantity > 0 && 
      product.inventoryStatus === InventoryStatus.INSTOCK &&
      !excludeIds.includes(product.id!)
    );
  });

  constructor() {
    // Initial search to load some products
    this.searchProducts('');

    // Sync internal selection with input
    effect(() => {
      this.internalSelection.set(this.selectedProduct());
    }, { allowSignalWrites: true });
  }

  ngOnDestroy(): void {
    // Clear any pending search timeout
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  }

  onProductChange(product: Product | null): void {
    this.internalSelection.set(product);
    this.productChange.emit(product);
  }

  onFilter(event: any): void {
    const query = event.filter || '';
    this.searchTerm.set(query);
    
    // Clear existing timeout
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    // Debounce search to avoid too many API calls
    this.searchTimeout = window.setTimeout(() => {
      this.searchProducts(query);
    }, 300);
  }

  private searchProducts(nameFilter: string): void {
    const filters: Record<string, any> = {};
    
    // Add name filter if provided
    if (nameFilter && nameFilter.trim()) {
      filters.name = nameFilter.trim();
    }
    
    // Add inventory status filter to only get in-stock products
    filters.inventoryStatus = InventoryStatus.INSTOCK;
    
    // Search for products with the given filters
    this.productSearch.search({
      page: 1,
      limit: 50, // Reasonable limit for dropdown
      filters: filters,
      sorts: [{ field: 'name', direction: 'asc' }] // Sort by name for better UX
    });
  }
}
