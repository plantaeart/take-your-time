import { Component, HostListener, OnInit, signal, ElementRef, inject, Input } from '@angular/core';

@Component({
  selector: 'app-top-page',
  standalone: true,
  imports: [],
  templateUrl: './top-page.component.html',
  styleUrl: './top-page.component.css'
})
export class TopPageComponent implements OnInit {
  isVisible = signal(false);
  @Input() scrollThreshold = 200; // Configurable threshold
  @Input() scrollContainer?: string; // Optional CSS selector for scroll container
  
  private elementRef = inject(ElementRef);

  ngOnInit(): void {
    this.checkScrollPosition();
    this.setupScrollListener();
  }

  private setupScrollListener(): void {
    // Use the specified container or fallback to parent
    const container = this.scrollContainer 
      ? document.querySelector(this.scrollContainer)
      : this.elementRef.nativeElement.parentElement;
    
    if (container) {
      container.addEventListener('scroll', () => {
        this.checkScrollPosition();
      });
      // Scroll listener attached successfully
    }
  }

  private checkScrollPosition(): void {
    const container = this.scrollContainer 
      ? document.querySelector(this.scrollContainer)
      : this.elementRef.nativeElement.parentElement;
    
    const scrollTop = container?.scrollTop || 0;
    this.isVisible.set(scrollTop > this.scrollThreshold);
  }

  scrollToTop(): void {
    const container = this.scrollContainer 
      ? document.querySelector(this.scrollContainer)
      : this.elementRef.nativeElement.parentElement;
    
    if (container) {
      container.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }
}
