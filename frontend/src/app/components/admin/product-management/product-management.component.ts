import { Component, OnInit, AfterViewInit, signal, computed, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { Table } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { ConfirmationService, MessageService, FilterService } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';
import { MultiSelectModule } from 'primeng/multiselect';
import { InputNumberComponent } from '../../ui/input-number/input-number.component';
import { Product, ProductCreateRequest, ProductUpdateRequest } from '../../../models/product.model';
import { Category, CategoryLabels, CategoryColors, PrimeNGSeverity } from '../../../enums/category.enum';
import { InventoryStatus, InventoryStatusLabels, InventoryStatusColors } from '../../../enums/inventory-status.enum';
import { useProducts } from '../../../hooks/product.hooks';

// Export interfaces
interface Column {
  field: string;
  header: string;
}

@Component({
  selector: 'app-product-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    DropdownModule,
    CheckboxModule,
    ConfirmDialogModule,
    TagModule,
    TooltipModule,
    InputNumberComponent,
    MultiSelectModule
  ],
  templateUrl: './product-management.component.html',
  styleUrl: './product-management.component.css',
  providers: [ConfirmationService, FilterService]
})
export class ProductManagementComponent implements OnInit, AfterViewInit {
  // Use product hooks
  productHooks = useProducts();

  // Table reference
  @ViewChild('dt') table!: Table;

  // Export column definitions
  cols: Column[] = [
    { field: 'id', header: 'ID' },
    { field: 'code', header: 'Code' },
    { field: 'name', header: 'Name' },
    { field: 'description', header: 'Description' },
    { field: 'category', header: 'Category' },
    { field: 'price', header: 'Price' },
    { field: 'quantity', header: 'Quantity' },
    { field: 'inventoryStatus', header: 'Status' }
  ];

  // Table state
  loading = signal(false);
  selectedProducts = signal<Product[]>([]);
  editingProduct = signal<Product | null>(null);
  isCreatingNew = signal(false);
  newProduct = signal<Partial<Product>>({});

  // Filter state
  globalFilterValue = signal('');

  // Options for dropdowns
  categoryOptions = [
    { label: 'Electronics', value: Category.ELECTRONICS },
    { label: 'Clothing', value: Category.CLOTHING },
    { label: 'Fitness', value: Category.FITNESS },
    { label: 'Accessories', value: Category.ACCESSORIES }
  ];

  inventoryStatusOptions = [
    { label: 'In Stock', value: InventoryStatus.INSTOCK },
    { label: 'Low Stock', value: InventoryStatus.LOWSTOCK },
    { label: 'Out of Stock', value: InventoryStatus.OUTOFSTOCK }
  ];

  constructor(
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private filterService: FilterService
  ) {}

  ngOnInit(): void {
    // Initial load will be triggered by PrimeNG's lazy loading
    this.initializeFilters();
  }

  ngAfterViewInit(): void {
    // Ensure table is properly initialized after view init
    setTimeout(() => {
      if (this.table) {
        // Initialize table state
        this.initializeTableFilters();
      }
    }, 100);
  }

  // Initialize filters for better functionality
  private initializeFilters(): void {
    // Set up any custom filter handling if needed
    // This ensures column filters work correctly
  }

  // Lazy loading method for PrimeNG
  async loadProductsLazy(event: any): Promise<void> {
    console.log('Lazy load event:', event); // Debug log
    
    // Ensure we have valid pagination values
    const first = event.first ?? 0;
    const rows = event.rows ?? 10;
    const page = Math.floor(first / rows) + 1; // Convert to 1-based page
    const limit = rows;
    
    console.log('Calculated page:', page, 'limit:', limit); // Debug log
    
    // Extract filters from the event if any
    const filters = this.buildFiltersFromEvent(event);
    
    try {
      await this.productHooks.loadProductsLazy(page, limit, filters);
      
      // Apply custom sorting after data is loaded (for client-side sorting if needed)
      // this.applyCustomSorting(event);
    } catch (error) {
      console.error('Load products error:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load products'
      });
    }
  }

  // Apply custom sorting for enum fields that need special handling
  private applyCustomSorting(event: any): void {
    // This method is currently not used since we're using backend sorting
    // But can be implemented for client-side sorting if needed
    if (!event.sortField || !this.table) return;
    
    const data = this.products();
    if (!data || data.length === 0) return;

    // For now, we delegate all sorting to the backend via lazy loading
    console.log('Custom sorting would be applied here for field:', event.sortField);
  }

  // Handle column filter changes
  onTableFilter(event: any): void {
    console.log('Table filter event:', event); // Debug log
    
    // When filters change, we need to trigger lazy loading with the new filters
    // Create a synthetic lazy load event with current pagination and new filters
    const lazyEvent = {
      first: 0, // Reset to first page when filtering
      rows: this.table?.rows || 10, // Current page size
      sortField: event.sortField,
      sortOrder: event.sortOrder,
      filters: event.filters
    };
    
    this.loadProductsLazy(lazyEvent);
  }

  // Build filters from PrimeNG table event
  private buildFiltersFromEvent(event: any): any {
    const filters: any = {};
    
    console.log('Building filters from event:', event); // Debug log
    
    // Add global search filter
    if (this.globalFilterValue()) {
      filters.search = this.globalFilterValue();
    }
    
    // Add sorting information
    if (event.sortField && event.sortField !== null && event.sortField !== undefined) {
      filters.sortBy = event.sortField;
      filters.sortOrder = event.sortOrder === 1 ? 'asc' : 'desc';
    }
    
    // Add column filters from PrimeNG event
    if (event.filters) {
      Object.keys(event.filters).forEach(field => {
        const filter = event.filters[field];
        if (filter && filter.value !== null && filter.value !== undefined && filter.value !== '') {
          // Handle different filter types
          if (field === 'category' || field === 'inventoryStatus') {
            filters[field] = filter.value;
          } else if (field === 'id' || field === 'price' || field === 'quantity' || field === 'rating') {
            // Numeric filters
            const numValue = Number(filter.value);
            if (!isNaN(numValue)) {
              filters[field] = numValue;
            }
          } else {
            // Text filters (name, description)
            filters[field] = String(filter.value);
          }
        }
      });
    }
    
    console.log('Built filters:', filters); // Debug log
    return filters;
  }

  // Computed properties
  products = computed(() => this.productHooks.products());
  totalRecords = computed(() => this.productHooks.totalRecords());
  hasSelectedProducts = computed(() => this.selectedProducts().length > 0);

  // Filter methods
  onGlobalFilter(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.globalFilterValue.set(input.value);
    // Use a debounced approach to avoid too many API calls
    this.debounceSearch();
  }

  private searchTimeout: any;
  
  private debounceSearch(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    this.searchTimeout = setTimeout(() => {
      // Reset the table to trigger lazy loading with new search term
      this.table?.reset();
    }, 500); // 500ms debounce
  }

  clearFilters(): void {
    this.globalFilterValue.set('');
    this.table?.clear();
    this.table?.reset();
  }

  resetTable(): void {
    this.clearFilters();
    this.selectedProducts.set([]);
    this.table?.reset();
    // Reinitialize filters after reset
    this.initializeTableFilters();
  }

  // Initialize table filters to ensure they work properly
  private initializeTableFilters(): void {
    setTimeout(() => {
      if (this.table) {
        // Force filter initialization by clearing and resetting
        this.table.clearState();
        this.table.saveState();
      }
    }, 100);
  }

  // Export functionality
  exportCSV(): void {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    const timeStr = today.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS format
    const filename = `products-${dateStr}-${timeStr}`;
    
    // Set the filename on the table before export
    this.table.exportFilename = filename;
    this.table.exportCSV();
  }

  getSeverityFromStatus(status: InventoryStatus): 'success' | 'warning' | 'danger' {
    switch (status) {
      case InventoryStatus.INSTOCK:
        return 'success';
      case InventoryStatus.LOWSTOCK:
        return 'warning';
      case InventoryStatus.OUTOFSTOCK:
        return 'danger';
      default:
        return 'warning';
    }
  }

  // Add new product row
  addNewProduct(): void {
    this.isCreatingNew.set(true);
    this.newProduct.set({
      name: '',
      description: '',
      category: Category.ELECTRONICS,
      price: 0,
      quantity: 0,
      inventoryStatus: InventoryStatus.INSTOCK,
      rating: null,
      image: null
    });
  }

  // Cancel new product creation
  cancelNewProduct(): void {
    this.isCreatingNew.set(false);
    this.newProduct.set({});
  }

  // Save new product
  async saveNewProduct(): Promise<void> {
    const productData = this.newProduct();
    
    // Validate required fields
    if (!productData.name || 
        productData.price === undefined || 
        productData.quantity === undefined ||
        !productData.category ||
        !productData.inventoryStatus ||
        productData.shellId === undefined) {
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'All fields except image and rating are required'
      });
      return;
    }

    // Create the request object with required fields
    const createRequest: ProductCreateRequest = {
      name: productData.name,
      description: productData.description || '',
      image: productData.image || null,
      category: productData.category,
      price: productData.price,
      quantity: productData.quantity,
      shellId: productData.shellId,
      inventoryStatus: productData.inventoryStatus,
      rating: productData.rating || null,
      code: productData.code,
      internalReference: productData.internalReference
    };

    try {
      // Create the product using the hooks
      await this.productHooks.createProduct(createRequest);
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Product created successfully'
      });
      this.cancelNewProduct();
      // Refresh the table to load updated data
      this.table?.reset();
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to create product'
      });
    }
  }

  // Edit product
  startEdit(product: Product): void {
    this.editingProduct.set({ ...product });
  }

  // Cancel edit
  cancelEdit(): void {
    this.editingProduct.set(null);
  }

  // Save edited product
  async saveEdit(): Promise<void> {
    const product = this.editingProduct();
    if (!product || !product.id) return;

    // Create the update request object
    const updateRequest: ProductUpdateRequest = {
      name: product.name,
      description: product.description,
      image: product.image,
      category: product.category,
      price: product.price,
      quantity: product.quantity,
      shellId: product.shellId,
      inventoryStatus: product.inventoryStatus,
      rating: product.rating
    };

    try {
      // Update the product using the hooks
      await this.productHooks.updateProduct(product.id, updateRequest);
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Product updated successfully'
      });
      this.cancelEdit();
      // Refresh the table to load updated data
      this.table?.reset();
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to update product'
      });
    }
  }

  // Delete single product
  deleteProduct(product: Product): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete "${product.name}"?`,
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        try {
          // Delete the product using the hooks
          if (product.id) {
            await this.productHooks.deleteProduct(product.id);
          }
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Product deleted successfully'
          });
          // Refresh the table to load updated data
          this.table?.reset();
        } catch (error) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to delete product'
          });
        }
      }
    });
  }

  // Bulk delete selected products
  deleteSelectedProducts(): void {
    const selected = this.selectedProducts();
    if (selected.length === 0) return;

    this.confirmationService.confirm({
      message: `Are you sure you want to delete ${selected.length} selected products?`,
      header: 'Confirm Bulk Deletion',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        try {
          const productIds = selected.map(p => p.id).filter((id): id is number => id !== undefined);
          // Bulk delete using the hooks
          await this.productHooks.bulkDeleteProducts(productIds);
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: `${selected.length} products deleted successfully`
          });
          this.selectedProducts.set([]);
          // Refresh the table to load updated data
          this.table?.reset();
        } catch (error) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to delete selected products'
          });
        }
      }
    });
  }

  // Update field for editing/creating
  updateField(product: Partial<Product>, field: string, value: any): void {
    (product as any)[field] = value;
  }

  // Check if product is being edited
  isEditing(product: Product): boolean {
    return this.editingProduct()?.id === product.id;
  }

  // Helper methods for template bindings
  getCategoryLabel(category: Category): string {
    return CategoryLabels[category] || category;
  }
  
  getInventoryStatusLabel(status: InventoryStatus): string {
    return InventoryStatusLabels[status] || status;
  }

  getCategoryColor(category: Category): PrimeNGSeverity {
    return CategoryColors[category] || 'secondary';
  }

  getInventoryStatusColor(status: InventoryStatus): string {
    return InventoryStatusColors[status] || '#6c757d';
  }

  // Safe getters for new product form
  getNewProductPrice(): number | null {
    return this.newProduct().price ?? null;
  }

  setNewProductPrice(value: number | null): void {
    this.newProduct.update(product => ({ ...product, price: value ?? 0 }));
  }

  getNewProductQuantity(): number | null {
    return this.newProduct().quantity ?? null;
  }

  setNewProductQuantity(value: number | null): void {
    this.newProduct.update(product => ({ ...product, quantity: value ?? 0 }));
  }

  getNewProductRating(): number | null {
    return this.newProduct().rating ?? null;
  }

  setNewProductRating(value: number | null): void {
    this.newProduct.update(product => ({ ...product, rating: value }));
  }

  // Safe getters for editing product
  getEditingProductRating(): number | null {
    return this.editingProduct()?.rating ?? null;
  }

  setEditingProductRating(value: number | null): void {
    const current = this.editingProduct();
    if (current) {
      this.editingProduct.set({ ...current, rating: value });
    }
  }
}
