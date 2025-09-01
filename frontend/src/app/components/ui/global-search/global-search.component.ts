import { Component, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-global-search',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputTextModule,
    ButtonModule
  ],
  templateUrl: './global-search.component.html',
  styleUrl: './global-search.component.css'
})
export class GlobalSearchComponent {
  // Inputs
  placeholder = input<string>('Search...');
  value = input<string>('');
  debounceTime = input<number>(300);
  showClearButton = input<boolean>(true);
  size = input<'small' | 'normal' | 'large'>('normal');

  // Outputs
  searchChange = output<string>();
  searchClear = output<void>();

  // Internal state
  searchValue = signal<string>('');
  private debounceTimeout: any;

  // Computed properties
  inputClass = computed(() => {
    const sizeClass = {
      'small': 'p-inputtext-sm',
      'normal': '',
      'large': 'p-inputtext-lg'
    };
    return sizeClass[this.size()];
  });

  constructor() {
    // Initialize with input value
    this.searchValue.set(this.value());
  }

  ngOnInit() {
    // Update internal value when input changes
    this.searchValue.set(this.value());
  }

  onSearchChange(value: string): void {
    this.searchValue.set(value);
    
    // Clear existing timeout
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }
    
    // Set new timeout for debounced search
    this.debounceTimeout = setTimeout(() => {
      this.searchChange.emit(value);
    }, this.debounceTime());
  }

  onClear(): void {
    this.searchValue.set('');
    this.searchChange.emit('');
    this.searchClear.emit();
  }
}
