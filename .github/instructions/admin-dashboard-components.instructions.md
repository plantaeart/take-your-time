---
applyTo: 'frontend/**'
---

# Admin Dashboard Architecture & Components Guide

## 🎯 Overview

The admin dashboard is a comprehensive management system built with Angular 18 and PrimeNG, providing CRUD operations for all application objects through a unified, configurable architecture.

### Key Features
- **Unified Configuration System** - All objects managed through consistent configuration files
- **Hierarchical Data Display** - Support for parent-child relationships (User → Cart/Wishlist)
- **Complete CRUD Operations** - Create, Read, Update, Delete with proper validation
- **Advanced Search & Filtering** - Real-time search with multiple filter options
- **Bulk Operations** - Multi-select and bulk actions
- **Responsive Design** - Works across all device sizes
- **Type Safety** - Full TypeScript integration with comprehensive types

---

## 🏗️ Component Architecture

### **Component Hierarchy**
```
AdminDashboardComponent (Main Container)
├── SignOutButtonComponent (Header)
├── TabViewModule (PrimeNG Tabs)
│   └── TabManagementComponent (Per Tab)
│       ├── TabColumnsHeaderComponent (Table Header)
│       ├── GlobalSearchComponent (Search Bar)
│       ├── ButtonConfirmPopupComponent (Bulk Actions)
│       └── RowTabComponent (Table Rows)
│           ├── Various Input Components (Editing)
│           ├── QuantityControlsComponent (Cart/Wishlist)
│           └── ProductSelectComponent (Add Products)
```

### **Data Flow**
```
Configuration Files → Dashboard Config → Tab Management → Row Components → UI Elements
Hook Services ← Store Management ← API Services ← Backend Endpoints
```

---

## 📋 Core Components

### **1. AdminDashboardComponent**
**Location**: `frontend/src/app/components/admin/admin-dashboard/`

**Purpose**: Main container that orchestrates all admin functionality

**Key Features**:
- Tab-based organization (Products, Users, Carts, Wishlists, Contacts)
- Unified configuration system using `dashboard.config.ts`
- Dependency injection for all services and hooks
- Global state management coordination

**Key Code Patterns**:
```typescript
export class AdminDashboardComponent implements OnInit {
  // Hook injections
  auth = useAuth();
  products = useProducts();
  userManagement = useUserManagement();
  
  // Configuration system
  dashboardConfig!: DashboardConfig;
  operationsHandler!: DashboardOperationsHandler;
  
  // ViewChild references for hierarchical management
  @ViewChild('cartTabManagement') cartTabManagement!: TabManagementComponent;
  @ViewChild('wishlistTabManagement') wishlistTabManagement!: TabManagementComponent;
  
  async ngOnInit(): Promise<void> {
    // Create configuration with dependencies
    const dependencies: DashboardDependencies = {
      products: this.products,
      adminProductSearch: this.adminProductSearch,
      // ... other dependencies
    };
    
    this.dashboardConfig = createDashboardConfig(dependencies);
    this.operationsHandler = new DashboardOperationsHandler(dependencies);
  }
}
```

**Template Structure**:
```html
<!-- Header with admin info and sign out -->
<div class="admin-header">
  <div class="admin-info">
    <img src="assets/icons/icon-512x512.png" alt="Logo" class="admin-logo">
    <span class="admin-email">Welcome {{ getAdminEmail() }}</span>
  </div>
  <app-sign-out-button [isAdmin]="true"></app-sign-out-button>
</div>

<!-- Tabbed interface -->
<div class="admin-content">
  <p-tabView [scrollable]="true" styleClass="admin-tabs">
    <p-tabPanel header="Products" leftIcon="pi pi-box">
      <app-tab-management 
        [config]="dashboardConfig.tabs.products"
        [data]="productData()"
        [loading]="isLoadingProducts()"
        [totalRecordsInput]="adminProductSearch.state().total"
        (dataLoad)="onProductDataLoad($event)">
      </app-tab-management>
    </p-tabPanel>
    <!-- Additional tabs... -->
  </p-tabView>
</div>
```

### **2. TabManagementComponent**
**Location**: `frontend/src/app/components/admin/tab-management/`

**Purpose**: Generic table management component that handles all object types

**Key Features**:
- **Configuration-driven** - Behavior defined by `TableManagementConfig`
- **Hierarchical data support** - Parent-child relationships (User → Cart items)
- **Advanced filtering** - Multiple filter types with real-time updates
- **Sorting** - Multi-column sorting capabilities
- **Pagination** - Server-side pagination with customizable page sizes
- **Bulk operations** - Multi-select with bulk actions
- **CRUD operations** - Inline editing, create, update, delete
- **Search integration** - Global search with debouncing

**Key Inputs**:
```typescript
// Configuration for table behavior
config = input.required<TableManagementConfig<T>>();

// Data and state
data = input.required<T[]>();
loading = input<boolean>(false);
totalRecordsInput = input<number>(0);

// Events
dataLoad = output<{ page: number; size: number; sorts: any[]; filters: any }>();
```

**Core Functionality**:
```typescript
export class TabManagementComponent<T = any> implements OnInit {
  // State management
  filters = signal<FilterState>({});
  sorts = signal<SortState[]>([]);
  currentPage = signal<number>(0);
  rowsPerPage = signal<number>(10);
  selectedItems = signal<Set<any>>(new Set());
  expandedItems = signal<Set<any>>(new Set());
  
  // Computed properties
  filteredData = computed(() => /* filtering logic */);
  paginatedData = computed(() => /* pagination logic */);
  isAllSelected = computed(() => /* selection logic */);
  
  // CRUD operations
  async handleCreate(item: Partial<T>): Promise<void> { }
  async handleUpdate(id: any, updates: Partial<T>): Promise<void> { }
  async handleDelete(id: any): Promise<void> { }
  async handleBulkDelete(ids: any[]): Promise<void> { }
  
  // Data management
  async loadData(): Promise<void> { }
  async refreshData(): Promise<void> { }
}
```

### **3. RowTabComponent**
**Location**: `frontend/src/app/components/admin/row-tab/`

**Purpose**: Individual table row component with inline editing capabilities

**Key Features**:
- **Inline editing** - Click to edit any editable field
- **Field validation** - Real-time validation with error display
- **Dynamic input types** - Text, number, dropdown, currency, checkbox, etc.
- **Hierarchical display** - Support for nested data (cart items under users)
- **Action buttons** - Edit, save, cancel, delete per row
- **Custom actions** - Object-specific actions (add to cart, etc.)

**Template Pattern**:
```html
<tr [class.editing]="isEditing()" [class.hierarchy-level]="hierarchyLevel()">
  <!-- Selection checkbox -->
  <td *ngIf="showSelect()">
    <p-checkbox [(ngModel)]="isSelected" />
  </td>
  
  <!-- Data columns with conditional editing -->
  <td *ngFor="let column of config().columns">
    @if (isEditing() && column.editable) {
      <!-- Dynamic input component based on column type -->
      <app-text-input *ngIf="column.type === 'text'" />
      <app-number-input *ngIf="column.type === 'number'" />
      <!-- ... other input types -->
    } @else {
      <!-- Display value with proper formatting -->
      <span>{{ getDisplayValue(column) }}</span>
    }
  </td>
  
  <!-- Action buttons -->
  <td class="actions">
    @if (isEditing()) {
      <p-button icon="pi pi-check" (click)="saveChanges()" />
      <p-button icon="pi pi-times" (click)="cancelEdit()" />
    } @else {
      <p-button icon="pi pi-pencil" (click)="startEdit()" />
      <p-button icon="pi pi-trash" (click)="deleteItem()" />
    }
  </td>
</tr>
```

### **4. TabColumnsHeaderComponent**
**Location**: `frontend/src/app/components/admin/tab-columns-header/`

**Purpose**: Table header with sorting and filtering controls

**Key Features**:
- **Column sorting** - Click headers to sort ascending/descending
- **Filter controls** - Dropdown filters for specific columns
- **Select all** - Bulk selection toggle
- **Responsive design** - Adapts to screen size
- **Dynamic columns** - Columns based on configuration

**Template Structure**:
```html
<thead>
  <tr>
    <!-- Select all checkbox -->
    <th *ngIf="showSelect()">
      <p-checkbox [(ngModel)]="isAllSelected()" (onChange)="toggleSelectAll.emit()" />
    </th>
    
    <!-- Column headers with sorting -->
    <th *ngFor="let column of columns()" 
        [class.sortable]="column.sortable"
        (click)="onSort(column.field)">
      
      <div class="column-header">
        <span>{{ column.header }}</span>
        
        <!-- Sort indicator -->
        <i *ngIf="column.sortable" [class]="getSortIcon(column.field)"></i>
        
        <!-- Filter button -->
        <app-button-confirm-popup 
          *ngIf="column.filterable"
          [config]="getFilterConfig(column)"
          (confirm)="filterApply.emit({ field: column.field, value: $event })">
        </app-button-confirm-popup>
      </div>
    </th>
    
    <!-- Actions column -->
    <th class="actions-header">Actions</th>
  </tr>
</thead>
```

---

## ⚙️ Configuration System

### **Configuration Files Structure**
```
object-management-config/
├── dashboard.config.ts          # Main dashboard configuration
├── table-config.interface.ts    # TypeScript interfaces
├── product.config.ts           # Product-specific configuration
├── user.config.ts              # User-specific configuration
├── user-cart.config.ts         # Cart-specific configuration
├── user-wishlist.config.ts     # Wishlist-specific configuration
└── contact.config.ts           # Contact-specific configuration (future)
```

### **Configuration Interface**
```typescript
export interface TableManagementConfig<T> {
  // Basic information
  title: string;
  entityName: string;
  apiEndpoint: string;
  
  // Columns definition
  columns: ColumnConfig[];
  
  // CRUD operations
  operations: {
    create: OperationConfig;
    update: OperationConfig;
    delete: OperationConfig;
    bulkDelete?: OperationConfig;
  };
  
  // Search and filtering
  searchConfig?: SearchConfig;
  filterConfig?: FilterConfig[];
  
  // Pagination
  paginationConfig: PaginationConfig;
  
  // Hierarchical data support
  hierarchyConfig?: HierarchyConfig;
  
  // Custom actions
  customActions?: CustomActionConfig[];
}
```

### **Column Configuration**
```typescript
export interface ColumnConfig {
  field: string;           // Object property name
  header: string;          // Display header
  type: ColumnType;        // text, number, currency, boolean, etc.
  width?: string;          // CSS width
  sortable?: boolean;      // Enable sorting
  filterable?: boolean;    // Enable filtering
  editable?: boolean;      // Enable inline editing
  required?: boolean;      // Required for creation/editing
  validation?: ValidationRule[];
  
  // Display formatting
  format?: string;         // Date/number format
  options?: SelectOption[]; // For dropdown columns
  
  // Conditional display
  visible?: boolean | ((item: any) => boolean);
  readonly?: boolean | ((item: any) => boolean);
}
```

### **Hierarchical Configuration**
```typescript
export interface HierarchyConfig {
  // Parent-child relationship
  parentIdField: string;          // Field linking to parent
  childrenField: string;          // Field containing children
  childAttributeField: string;    // 'cart' or 'wishlist'
  
  // Level configurations
  levels: LevelConfig[];
  
  // Child actions (add products to cart/wishlist)
  childActions?: ChildActionConfig[];
  
  // Expansion behavior
  expandable: boolean;
  lazyLoading?: boolean;
}
```

---

## 🎨 Styling System

### **CSS Architecture**
```scss
// Component-specific styles
admin-dashboard.component.css     // Main dashboard layout
tab-management.component.css      // Table management styles
row-tab.component.css            // Individual row styles
tab-columns-header.component.css  // Header styles
```

### **Key CSS Classes**
```scss
// Dashboard layout
.admin-header { /* Header styling */ }
.admin-content { /* Main content area */ }
.admin-tabs { /* Tab styling */ }

// Table management
.table-container { /* Table wrapper */ }
.table-header { /* Header section */ }
.table-controls { /* Search and filters */ }
.table-body { /* Data rows */ }

// Row styling
.table-row { /* Standard row */ }
.table-row.editing { /* Editing mode */ }
.table-row.selected { /* Selected row */ }
.table-row.hierarchy-level-1 { /* Child rows */ }

// Responsive design
@media (max-width: 768px) {
  .table-container { /* Mobile layout */ }
}
```

### **PrimeNG Integration**
```scss
// Custom PrimeNG overrides
:host ::ng-deep .p-tabview {
  .p-tabview-panels {
    padding: 0;
  }
}

:host ::ng-deep .p-button {
  margin: 0.25rem;
}

:host ::ng-deep .p-datatable {
  .p-datatable-header {
    background: var(--surface-card);
  }
}
```

---

## 🔄 Data Flow & State Management

### **Hook Integration Pattern**
```typescript
// Dashboard component injects all hooks
export class AdminDashboardComponent {
  // Core data hooks
  products = useProducts();
  userManagement = useUserManagement();
  cartManagement = useCartManagement();
  wishlistManagement = useWishlistManagement();
  
  // Search hooks
  adminProductSearch = useAdminProductSearch();
  adminUserSearch = useAdminUserSearch();
  adminCartSearch = useAdminCartSearch();
  adminWishlistSearch = useAdminWishlistSearch();
}
```

### **Configuration Creation**
```typescript
// Create unified configuration
async ngOnInit(): Promise<void> {
  const dependencies: DashboardDependencies = {
    products: this.products,
    adminProductSearch: this.adminProductSearch,
    userManagement: this.userManagement,
    // ... all other hooks
  };
  
  // Create dashboard configuration
  this.dashboardConfig = createDashboardConfig(dependencies);
  this.operationsHandler = new DashboardOperationsHandler(dependencies);
}
```

### **Data Loading Flow**
```
User Action (search, sort, page) 
→ TabManagementComponent.dataLoad.emit()
→ AdminDashboardComponent.onDataLoad()
→ OperationsHandler.handleDataLoad()
→ Appropriate hook service call
→ API request to backend
→ Store update
→ Signal update
→ UI refresh
```

---

## 🧪 Testing Strategy

### **Component Testing**
```typescript
describe('AdminDashboardComponent', () => {
  let component: AdminDashboardComponent;
  let fixture: ComponentFixture<AdminDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminDashboardComponent],
      providers: [
        // Mock all hook dependencies
        { provide: 'useProducts', useValue: mockProductHook },
        { provide: 'useUserManagement', useValue: mockUserHook },
      ]
    }).compileComponents();
  });

  it('should create dashboard configuration', () => {
    expect(component.dashboardConfig).toBeDefined();
    expect(component.dashboardConfig.tabs.products).toBeDefined();
  });

  it('should handle data loading', async () => {
    await component.onProductDataLoad({ page: 1, size: 10, sorts: [], filters: {} });
    expect(mockProductHook.loadProducts).toHaveBeenCalled();
  });
});
```

### **Integration Testing**
```typescript
describe('Tab Management Integration', () => {
  it('should create and delete products', async () => {
    // Test full CRUD workflow
    await component.createProduct(mockProductData);
    expect(component.products().length).toBeGreaterThan(0);
    
    await component.deleteProduct(productId);
    expect(component.products().find(p => p.id === productId)).toBeUndefined();
  });
});
```

---

## 🚀 Performance Optimization

### **OnPush Change Detection**
```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  // ... component config
})
export class TabManagementComponent {
  // Uses signals for reactive updates
  data = computed(() => this.filteredData());
}
```

### **Virtual Scrolling (Future)**
```html
<!-- For large datasets -->
<cdk-virtual-scroll-viewport itemSize="50">
  <app-row-tab *cdkVirtualFor="let item of data()" [item]="item" />
</cdk-virtual-scroll-viewport>
```

### **Lazy Loading**
```typescript
// Hierarchical data lazy loading
async expandNode(parentId: any): Promise<void> {
  if (!this.loadedChildren.has(parentId)) {
    this.loading.set(true);
    const children = await this.loadChildData(parentId);
    this.addChildrenToParent(parentId, children);
    this.loadedChildren.add(parentId);
    this.loading.set(false);
  }
}
```

---

## 📝 Development Guidelines

### **Adding New Object Types**
1. **Create configuration file** - `object-management-config/{object}.config.ts`
2. **Define interfaces** - Add TypeScript models
3. **Create hook services** - Service-Store-Hook pattern
4. **Add to dashboard** - Register in `dashboard.config.ts`
5. **Add tab** - Update `admin-dashboard.component.html`
6. **Test thoroughly** - Unit and integration tests

### **Configuration Best Practices**
- **Type safety** - Use TypeScript interfaces for all configs
- **Reusability** - Extract common patterns into shared utilities
- **Validation** - Include field validation rules in column config
- **Performance** - Use computed signals for derived state
- **Accessibility** - Include ARIA labels and keyboard navigation

### **Error Handling**
```typescript
// Centralized error handling in operations handler
async handleOperation(operation: () => Promise<void>): Promise<void> {
  try {
    this.loading.set(true);
    await operation();
    this.showSuccess('Operation completed successfully');
  } catch (error) {
    this.showError(`Operation failed: ${error.message}`);
  } finally {
    this.loading.set(false);
  }
}
```

---

## 🔧 Troubleshooting

### **Common Issues**

**Configuration not loading**:
- Check that config service is properly injected
- Verify all dependencies are available in ngOnInit
- Check browser console for initialization errors

**Data not updating**:
- Ensure signals are properly connected
- Check that hook services are called correctly
- Verify API endpoints are returning expected data

**Hierarchical data not expanding**:
- Check ViewChild references are properly set
- Verify expand/collapse functions are bound correctly
- Check that parent-child relationships are properly configured

**Performance issues**:
- Use OnPush change detection
- Implement virtual scrolling for large datasets
- Optimize signal dependencies

---

## 📚 Related Documentation

- [Admin Dashboard Object Management](./admin-dashboard-object-management.instructions.md) - Adding new objects
- [Angular 18 Best Practices](./angular-18-best-practices.instructions.md) - Development guidelines
- [Backend Information](./backend-information.instructions.md) - API integration
- [PrimeNG Documentation](https://primeng.org/) - UI component library

---

**Remember**: The admin dashboard is designed to be highly configurable and maintainable. Always follow the established patterns and add comprehensive tests when extending functionality.
