# Angular Frontend - Take Your Time

Modern Angular 18 frontend application for the Take Your Time product management system.

## 🚀 Quick Start

### Development Mode
```bash
# Install dependencies
npm install

# Start development server
ng serve
# or
npm start
```

The application will be available at `http://localhost:4200`.

### Production Build
```bash
# Build for production
ng build --configuration production

# Serve built files
npx http-server dist/frontend -p 4200
```

### Environment Configuration

The Angular application uses environment files located in `src/environments/`:

- `environment.ts` - Development configuration
- `environment.prod.ts` - Production configuration  
- `environment.docker.ts` - Docker-specific configuration

These files are compiled into the build and don't require external .env files.

## 🏗️ Architecture

### Tech Stack
- **Angular 18**: Modern framework with standalone components
- **PrimeNG**: UI component library
- **TypeScript**: Type-safe development
- **Signals**: Reactive state management
- **SCSS**: Styling with design tokens

### Project Structure
```
src/
├── app/
│   ├── components/          # UI components
│   ├── services/           # API services
│   ├── stores/             # State management
│   ├── hooks/              # Reusable logic
│   ├── models/             # TypeScript interfaces
│   └── environments/       # Environment config
├── assets/                 # Static assets
└── styles/                 # Global styles
```

### Key Features
- **Standalone Components**: No NgModules required
- **Signal-based State**: Modern reactive patterns
- **Service-Store-Hooks**: Layered architecture
- **Type Safety**: Comprehensive TypeScript coverage
- **Modern Control Flow**: @if, @for, @switch syntax

## 🔧 Development Guidelines

### Component Development
```typescript
// Use standalone components
@Component({
  selector: 'app-feature',
  standalone: true,
  imports: [CommonModule, PrimeNGModule],
  template: `
    @if (isLoading()) {
      <p-progressSpinner />
    } @else {
      <div>{{ content() }}</div>
    }
  `
})
export class FeatureComponent {
  // Use signals for state
  isLoading = signal(false);
  content = signal('');
  
  // Use hooks for data access
  private productList = useProductList();
}
```

### State Management
```typescript
// Store pattern
@Injectable({ providedIn: 'root' })
export class FeatureStore {
  private _items = signal<Item[]>([]);
  items = this._items.asReadonly();
  
  async loadItems() {
    this._items.set(await this.service.getItems());
  }
}

// Hook pattern
export function useFeature() {
  const store = inject(FeatureStore);
  return {
    items: store.items,
    loadItems: () => store.loadItems()
  };
}
```

## 🧪 Testing

```bash
# Run unit tests
ng test

# Run e2e tests
ng e2e

# Run tests with coverage
ng test --code-coverage
```

## 📦 Build & Deployment

### Production Build
```bash
# Build with optimizations
ng build --configuration production

# Analyze bundle size
npx webpack-bundle-analyzer dist/frontend/stats.json
```

## 🔍 Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Kill process on port 4200
   npx kill-port 4200
   ```

2. **Node modules issues**
   ```bash
   # Clean install
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Docker build failures**
   ```bash
   # Clean Docker environment
   python manage.py clean
   docker system prune -f
   ```

### Performance Optimization
- Use OnPush change detection
- Implement trackBy functions
- Lazy load feature modules
- Optimize bundle size with tree shaking

## 📚 Documentation

- [Angular Documentation](https://angular.io/docs)
- [PrimeNG Components](https://primeng.org/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 🤝 Contributing

1. Follow Angular style guide
2. Use conventional commits
3. Write comprehensive tests
4. Update documentation