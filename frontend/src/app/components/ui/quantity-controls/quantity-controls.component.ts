import { Component, Input, Output, EventEmitter, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';

@Component({
  selector: 'app-quantity-controls',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputNumberModule
  ],
  templateUrl: './quantity-controls.component.html',
  styleUrl: './quantity-controls.component.css'
})
export class QuantityControlsComponent {
  // Required inputs
  productId = input.required<number>();
  currentQuantity = input.required<number>();
  maxQuantity = input.required<number>();
  
  // Optional inputs with defaults
  minQuantity = input<number>(1);
  disabled = input<boolean>(false);
  showLabel = input<boolean>(true);
  label = input<string>('Qty:');
  size = input<'small' | 'normal'>('small');
  hasError = input<boolean>(false);
  
  // Outputs
  quantityChange = output<number>();
  
  /**
   * Handle quantity change from input number
   */
  onQuantityChange(newQuantity: number): void {
    if (newQuantity !== this.currentQuantity()) {
      this.quantityChange.emit(newQuantity);
    }
  }
  
  /**
   * Get CSS classes for the component
   */
  getComponentClasses(): string {
    const classes = ['quantity-controls'];
    
    if (this.size() === 'small') {
      classes.push('quantity-controls-small');
    }
    
    if (this.hasError()) {
      classes.push('quantity-error');
    }
    
    return classes.join(' ');
  }
}
