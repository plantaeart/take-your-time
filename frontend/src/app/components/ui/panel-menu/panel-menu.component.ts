import {
    Component,
    signal,
    computed
  } from "@angular/core";
import { MenuItem } from "primeng/api";
import { PanelMenuModule } from 'primeng/panelmenu';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { RouterModule } from '@angular/router';
  
  @Component({
    selector: "app-panel-menu",
    standalone: true,
    imports: [PanelMenuModule, ButtonModule, TooltipModule, RouterModule],
    templateUrl: './panel-menu.component.html',
    styleUrl: './panel-menu.component.css'
  })
  export class PanelMenuComponent {
    isCollapsed = signal(false);
    
    // Computed menu width
    menuWidth = computed(() => this.isCollapsed() ? '70px' : '280px');
    
    // Toggle button icon
    toggleIcon = computed(() => this.isCollapsed() ? 'pi-angle-right' : 'pi-angle-left');
    
    // Menu items for expanded state
    expandedItems: MenuItem[] = [
        {
            label: 'Home',
            icon: 'pi pi-home',
            routerLink: ['/home'],
            id: 'panel-menu-home-link'
        },
        {
            label: 'Products',
            icon: 'pi pi-barcode',
            routerLink: ['/products/list'],
            id: 'panel-menu-products-link'
        }
    ];
    
    // Menu items for collapsed state (icons only)
    collapsedItems: MenuItem[] = [
        {
            icon: 'pi pi-home',
            routerLink: ['/home'],
            id: 'panel-menu-home-link-collapsed',
            title: 'Home'
        },
        {
            icon: 'pi pi-barcode',
            routerLink: ['/products/list'],
            id: 'panel-menu-products-link-collapsed',
            title: 'Products'
        }
    ];
    
    // Current menu items based on state
    menuItems = computed(() => this.isCollapsed() ? this.collapsedItems : this.expandedItems);

    toggleMenu(): void {
        this.isCollapsed.set(!this.isCollapsed());
    }
  }
  