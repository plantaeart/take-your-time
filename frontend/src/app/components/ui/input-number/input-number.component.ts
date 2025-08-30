import { Component, input, output, model } from '@angular/core';
import { InputNumberModule } from 'primeng/inputnumber';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-input-number',
  standalone: true,
  imports: [InputNumberModule, FormsModule],
  templateUrl: './input-number.component.html',
  styleUrl: './input-number.component.css'
})
export class InputNumberComponent {
  // Input properties
  value = model<number | null>(null);
  min = input<number>(0);
  max = input<number | null>(null);
  step = input<number>(1);
  placeholder = input<string>('');
  disabled = input<boolean>(false);
  showButtons = input<boolean>(false);
  mode = input<'decimal' | 'currency'>('decimal');
  currency = input<string>('USD');
  locale = input<string>('en-US');
  suffix = input<string>('');
  prefix = input<string>('');

  // Events
  onInput = output<number | null>();
  onFocus = output<Event>();
  onBlur = output<Event>();

  handleInput(event: any): void {
    this.onInput.emit(event.value);
  }

  handleFocus(event: Event): void {
    this.onFocus.emit(event);
  }

  handleBlur(event: Event): void {
    this.onBlur.emit(event);
  }
}
