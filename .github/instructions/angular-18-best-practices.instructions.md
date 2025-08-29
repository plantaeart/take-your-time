---
applyTo: 'frontend/**'
---

# Angular 18 Best Practices & Development Guidelines

## 🚀 Core Principles

**Modern Angular 18** emphasizes performance, developer experience, and maintainability through:
- **Standalone Components** (no NgModules)
- **Signals** for reactive state management
- **New Control Flow** (@if, @for, @switch)
- **Dependency Injection** with modern patterns
- **TypeScript-first** development

---

## 🏗️ Project Architecture

### **Component Generation**
**Always use Angular CLI to generate components:**
```bash
# Generate component with proper structure
ng generate component components/feature/component-name

# Examples:
ng generate component components/user/user-cart-detail
ng generate component components/products/product-card
ng generate component components/ui/loading-spinner

# Short form:
ng g c components/user/user-cart-detail
```

**Benefits of using ng generate:**
- ✅ Proper file structure and naming conventions
- ✅ Automatic standalone component configuration
- ✅ Template and stylesheet files created
- ✅ Component registration and imports handled
- ✅ Test file generation included

### **Folder Structure**
```
src/app/
├── components/           # UI components
│   ├── ui/              # Reusable UI components
│   ├── products/        # Feature-specific components
│   └── shared/          # Shared components
├── services/            # API communication layer
├── stores/              # State management (signals)
├── hooks/               # Reusable logic hooks
├── models/              # TypeScript interfaces/types
├── enums/               # Application enums
├── environments/        # Environment configuration
└── styles/              # Global styles
```

### **Service-Store-Hooks Pattern**
```typescript
// 1. Service Layer (API Communication)
@Injectable({ providedIn: 'root' })
export class ProductService {
  async getProducts(): Promise<ProductResponse> { }
}

// 2. Store Layer (State Management)
@Injectable({ providedIn: 'root' })
export class ProductStore {
  products = signal<Product[]>([]);
  isLoading = signal(false);
}

// 3. Hooks Layer (Component Integration)
export function useProductList() {
  return {
    products: store.products.asReadonly(),
    loadProducts: () => store.loadProducts()
  };
}
```

---

## 🧩 Component Best Practices

### **1. Standalone Components (Always)**
```typescript
@Component({
  selector: 'app-product-card',
  standalone: true,                    // ✅ Always standalone
  imports: [CommonModule, ButtonModule], // ✅ Import only what you need
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.css' // ✅ styleUrl (singular)
})
export class ProductCardComponent { }
```

### **2. Use Signals for State**
```typescript
export class ProductComponent {
  // ✅ Signals for reactive state
  products = signal<Product[]>([]);
  isLoading = signal(false);
  selectedProduct = signal<Product | null>(null);
  
  // ✅ Computed signals for derived state
  filteredProducts = computed(() => 
    this.products().filter(p => p.isActive)
  );
  
  // ✅ Effects for side effects
  constructor() {
    effect(() => {
      console.log('Products updated:', this.products().length);
    });
  }
}
```

### **3. Modern Control Flow**
```html
<!-- ✅ Use @if instead of *ngIf -->
@if (isLoading()) {
  <app-loading-spinner />
} @else {
  <div class="content">{{ content }}</div>
}

<!-- ✅ Use @for instead of *ngFor -->
@for (product of products(); track product.id) {
  <app-product-card [product]="product" />
} @empty {
  <p>No products found</p>
}

<!-- ✅ Use @switch instead of *ngSwitch -->
@switch (status()) {
  @case ('loading') { <app-loader /> }
  @case ('error') { <app-error /> }
  @case ('success') { <app-content /> }
  @default { <app-fallback /> }
}
```

### **4. Proper Input/Output Patterns**
```typescript
export class ProductCardComponent {
  // ✅ Use input() function for inputs
  product = input.required<Product>();
  showDetails = input(false);
  
  // ✅ Use output() function for outputs
  productSelected = output<Product>();
  favoriteToggled = output<{ productId: number; isFavorite: boolean }>();
  
  // ✅ Use computed for derived values
  displayPrice = computed(() => 
    `$${this.product().price.toFixed(2)}`
  );
  
  onSelect() {
    this.productSelected.emit(this.product());
  }
}
```

---

## 🔄 State Management

### **1. Signals Over RxJS (When Possible)**
```typescript
// ✅ Use signals for simple state
export class UserStore {
  private _user = signal<User | null>(null);
  private _isLoading = signal(false);
  
  // ✅ Readonly signals for external access
  user = this._user.asReadonly();
  isLoading = this._isLoading.asReadonly();
  
  // ✅ Computed for derived state
  isAuthenticated = computed(() => this._user() !== null);
  
  async loadUser(id: number) {
    this._isLoading.set(true);
    try {
      const user = await this.userService.getUser(id);
      this._user.set(user);
    } finally {
      this._isLoading.set(false);
    }
  }
}
```

### **2. RxJS for Complex Async Operations**
```typescript
// ✅ Use RxJS for complex streams
export class SearchStore {
  private searchTerm$ = new BehaviorSubject('');
  
  results$ = this.searchTerm$.pipe(
    debounceTime(300),
    distinctUntilChanged(),
    switchMap(term => this.searchService.search(term)),
    shareReplay(1)
  );
  
  // ✅ Convert to signals when needed
  results = toSignal(this.results$, { initialValue: [] });
}
```

---

## 🎯 Type Safety

### **1. Strict TypeScript Configuration**
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true
  }
}
```

### **2. Comprehensive Type Definitions**
```typescript
// ✅ Define clear interfaces
export interface Product {
  readonly id: number;
  name: string;
  price: number;
  category: ProductCategory;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ✅ Use enums for constants
export enum ProductCategory {
  ELECTRONICS = 'ELECTRONICS',
  CLOTHING = 'CLOTHING',
  FITNESS = 'FITNESS'
}

// ✅ Type service responses
export interface ProductResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
}
```

### **3. Generic Types for Reusability**
```typescript
// ✅ Generic API response interface
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

// ✅ Generic store pattern
export abstract class BaseStore<T> {
  protected _items = signal<T[]>([]);
  protected _isLoading = signal(false);
  
  items = this._items.asReadonly();
  isLoading = this._isLoading.asReadonly();
  
  abstract load(): Promise<void>;
}
```

---

## 🛠️ Dependency Injection

### **1. Modern Injection Patterns**
```typescript
// ✅ Constructor injection with readonly
export class ProductService {
  constructor(
    private readonly http: HttpClient,
    private readonly config: ConfigService
  ) {}
}

// ✅ Inject function for standalone components
export class ProductComponent {
  private productService = inject(ProductService);
  private router = inject(Router);
  
  // ✅ Use destroyRef for cleanup
  private destroyRef = inject(DestroyRef);
}
```

### **2. Provide Functions**
```typescript
// ✅ Use provide functions
export const APP_CONFIG = {
  providers: [
    provideHttpClient(withInterceptors([authInterceptor])),
    provideRouter(routes),
    provideAnimations(),
    // Custom providers
    { provide: 'API_URL', useValue: environment.apiUrl }
  ]
};
```

---

## 🎨 Styling Best Practices

### **1. Component-Scoped Styles**
```scss
// product-card.component.scss
:host {
  display: block;
  
  // ✅ Use CSS custom properties
  --card-padding: 1rem;
  --card-border-radius: 0.5rem;
}

.card {
  padding: var(--card-padding);
  border-radius: var(--card-border-radius);
  
  // ✅ Use modern CSS features
  container-type: inline-size;
  
  @container (min-width: 400px) {
    --card-padding: 1.5rem;
  }
}
```

### **2. Global Design Tokens**
```scss
// styles/tokens.scss
:root {
  // ✅ Semantic color names
  --color-primary: #667eea;
  --color-secondary: #764ba2;
  --color-success: #10b981;
  --color-error: #ef4444;
  
  // ✅ Spacing system
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;
}
```

---

## 🧪 Testing Best Practices

### **1. Test ID Naming Convention**
```html
<!-- ✅ Consistent test ID format: <component-name>-<element-name>-<type> -->
<button id="products-display-show-more-btn">Show More</button>
<div id="product-card-container-{{ product.id }}">...</div>
<input id="user-profile-email-input" type="email">
<p-button id="products-display-retry-btn" label="Try Again"></p-button>

<!-- ✅ Dynamic IDs for lists -->
<div [id]="'product-card-' + product.id">
  <button [id]="'product-add-to-cart-btn-' + product.id">Add to Cart</button>
  <button [id]="'product-wishlist-btn-' + product.id">Wishlist</button>
</div>

<!-- ✅ State-specific IDs -->
<div id="products-display-loading-grid">Loading...</div>
<div id="products-display-error-container">Error...</div>
<div id="products-display-empty-state">No products...</div>
```

### **2. Test ID Guidelines**
- **Format**: `<component-name>-<element-name>-<type>`
- **Component Name**: Use kebab-case component name without "Component" suffix
- **Element Name**: Descriptive name for the element's purpose
- **Type Suffixes**: 
  - `-btn` (buttons)
  - `-input` (form inputs)
  - `-link` (navigation links)
  - `-container` (wrapper divs)
  - `-grid` (grid layouts)
  - `-card` (card components)
  - `-icon` (icons)
  - `-img` (images)

### **3. Examples by Component Type**
```typescript
// ✅ Navigation Components
"app-logo-img"
"app-cart-icon" 
"app-navigation-panel"
"panel-menu-home-link"
"panel-menu-products-link"

// ✅ Product Components  
"products-display-grid"
"products-display-show-more-btn"
"product-card-123" // Dynamic with product ID
"product-add-to-cart-btn-123"
"product-wishlist-btn-123"

// ✅ Form Components
"user-profile-email-input"
"user-profile-save-btn"
"login-form-submit-btn"

// ✅ State Components
"products-display-loading-grid"
"products-display-error-container"
"products-display-empty-state"
```

### **4. Playwright Integration**
```typescript
// ✅ Easy element selection in Playwright tests
await page.click('#products-display-show-more-btn');
await page.fill('#user-profile-email-input', 'test@example.com');
await expect(page.locator('#product-card-123')).toBeVisible();

// ✅ Dynamic element testing
const productId = '123';
await page.click(`#product-add-to-cart-btn-${productId}`);
await page.click(`#product-wishlist-btn-${productId}`);

// ✅ State testing
await expect(page.locator('#products-display-loading-grid')).toBeVisible();
await expect(page.locator('#products-display-error-container')).toBeHidden();
```

### **5. Component Testing**
```typescript
describe('ProductCardComponent', () => {
  let component: ProductCardComponent;
  let fixture: ComponentFixture<ProductCardComponent>;
  
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductCardComponent] // ✅ Import standalone component
    }).compileComponents();
    
    fixture = TestBed.createComponent(ProductCardComponent);
    component = fixture.componentInstance;
  });
  
  it('should display product information', () => {
    // ✅ Use signal setters for testing
    fixture.componentRef.setInput('product', mockProduct);
    fixture.detectChanges();
    
    expect(fixture.nativeElement.textContent).toContain(mockProduct.name);
  });
});
```

### **2. Service Testing**
```typescript
describe('ProductService', () => {
  let service: ProductService;
  let httpMock: HttpTestingController;
  
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(ProductService);
    httpMock = TestBed.inject(HttpTestingController);
  });
  
  it('should fetch products', async () => {
    const mockProducts = [{ id: 1, name: 'Test Product' }];
    
    const promise = service.getProducts();
    const req = httpMock.expectOne('/api/products');
    req.flush({ products: mockProducts });
    
    const result = await promise;
    expect(result.products).toEqual(mockProducts);
  });
});
```

---

## 🚦 Performance Optimization

### **1. OnPush Change Detection**
```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush, // ✅ Always use OnPush
  // ... other config
})
export class ProductListComponent {
  // ✅ Signals automatically work with OnPush
  products = signal<Product[]>([]);
}
```

### **2. Lazy Loading**
```typescript
// ✅ Lazy load feature modules
export const routes: Routes = [
  {
    path: 'products',
    loadComponent: () => import('./components/products/products.component')
      .then(m => m.ProductsComponent)
  },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes')
      .then(m => m.ADMIN_ROUTES)
  }
];
```

### **3. TrackBy Functions**
```typescript
// ✅ Always use trackBy for lists
@Component({
  template: `
    @for (product of products(); track trackByProductId) {
      <app-product-card [product]="product" />
    }
  `
})
export class ProductListComponent {
  trackByProductId(index: number, product: Product): number {
    return product.id;
  }
}
```

---

## 🔧 Development Tools

### **1. Angular CLI Configuration**
```json
// angular.json
{
  "projects": {
    "app": {
      "architect": {
        "build": {
          "options": {
            "budgets": [
              {
                "type": "initial",
                "maximumWarning": "500kb",
                "maximumError": "1mb"
              }
            ]
          }
        }
      }
    }
  }
}
```

### **2. ESLint Configuration**
```json
// .eslintrc.json
{
  "extends": [
    "@angular-eslint/recommended",
    "@typescript-eslint/recommended"
  ],
  "rules": {
    "@angular-eslint/prefer-standalone": "error",
    "@typescript-eslint/explicit-function-return-type": "error",
    "@typescript-eslint/no-explicit-any": "error"
  }
}
```

---

## 📝 Code Style Guidelines

### **1. Naming Conventions**
```typescript
// ✅ PascalCase for classes, interfaces, enums
export class ProductService { }
export interface UserProfile { }
export enum OrderStatus { }

// ✅ camelCase for variables, functions, properties
const userProfile = { };
function calculateTotal(): number { }
private readonly apiUrl = '';

// ✅ kebab-case for selectors, file names
selector: 'app-product-card'
// product-card.component.ts

// ✅ SCREAMING_SNAKE_CASE for constants
const API_ENDPOINTS = {
  PRODUCTS: '/api/products'
} as const;
```

### **2. Function Organization**
```typescript
export class ProductComponent {
  // ✅ 1. Properties (signals first)
  products = signal<Product[]>([]);
  private readonly service = inject(ProductService);
  
  // ✅ 2. Computed properties
  filteredProducts = computed(() => /* ... */);
  
  // ✅ 3. Lifecycle hooks
  ngOnInit(): void { }
  
  // ✅ 4. Public methods
  loadProducts(): void { }
  
  // ✅ 5. Private methods
  private validateProduct(): boolean { }
}
```

---

## 🛡️ Error Handling

### **1. Service Error Handling**
```typescript
export class ProductService {
  async getProducts(): Promise<ProductResponse> {
    try {
      const response = await this.http.get<ProductResponse>('/api/products').toPromise();
      return response!;
    } catch (error) {
      // ✅ Centralized error handling
      this.errorHandler.handleError('Failed to load products', error);
      throw error;
    }
  }
}
```

### **2. Component Error Boundaries**
```typescript
export class ProductListComponent {
  error = signal<string | null>(null);
  
  async loadProducts(): Promise<void> {
    try {
      this.error.set(null);
      await this.productStore.loadProducts();
    } catch (error) {
      this.error.set('Failed to load products. Please try again.');
    }
  }
}
```

---

## ✅ Development Checklist

### **Before Code Review**
- [ ] All components are standalone
- [ ] Using signals instead of RxJS where appropriate
- [ ] New control flow (@if, @for, @switch) used
- [ ] Proper TypeScript typing (no `any`)
- [ ] OnPush change detection strategy
- [ ] TrackBy functions for lists
- [ ] **Test IDs added to all interactive elements**
- [ ] **Test ID naming convention followed**
- [ ] Error handling implemented
- [ ] Tests written and passing
- [ ] Accessibility attributes added
- [ ] Performance considerations addressed

### **Before Production**
- [ ] Bundle size analysis completed
- [ ] Lighthouse score > 90
- [ ] All console errors resolved
- [ ] Cross-browser testing completed
- [ ] Mobile responsiveness verified
- [ ] Security best practices followed

---

## 🚀 Migration Guidelines

### **From Angular 16/17 to 18**
```typescript
// ❌ Old pattern
@Component({
  template: `
    <div *ngIf="isVisible">Content</div>
    <div *ngFor="let item of items">{{ item }}</div>
  `
})

// ✅ New pattern
@Component({
  template: `
    @if (isVisible()) {
      <div>Content</div>
    }
    @for (item of items(); track item.id) {
      <div>{{ item }}</div>
    }
  `
})
```

---

## 🎯 Current Implementation Status

### **✅ Completed Patterns**
- Service-Store-Hooks architecture (ProductService, ProductStore, product.hooks.ts)
- Standalone components with signals (TopPageComponent, ProductsDisplayComponent)
- Modern control flow (@if, @for) implementation
- PrimeNG integration with proper TypeScript typing
- Environment configuration system
- Responsive design with CSS Grid and modern styling

### **🔧 Active Development Guidelines**
- **Always use standalone components** - No NgModules needed
- **Prefer signals over RxJS** - For simple state management
- **Use modern control flow** - @if, @for, @switch instead of structural directives
- **TypeScript-first approach** - Comprehensive typing for all interfaces
- **Performance-oriented** - OnPush change detection, lazy loading, trackBy functions

---

**Remember**: Angular 18 emphasizes simplicity, performance, and developer experience. Always prefer the modern patterns over legacy approaches, even if they require a small learning curve. The benefits in maintainability and performance are worth it!
