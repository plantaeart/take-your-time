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
import { useAuthState, useAuthActions } from '../../../hooks/auth.hooks';
  
  @Component({
    selector: "app-panel-menu",
    standalone: true,
    imports: [PanelMenuModule, ButtonModule, TooltipModule, RouterModule],
    templateUrl: './panel-menu.component.html',
    styleUrl: './panel-menu.component.css'
  })
  export class PanelMenuComponent {
    isCollapsed = signal(true); // Default to collapsed state
    
    // Auth hooks
    private authState = useAuthState();
    private authActions = useAuthActions();
    
    // Computed menu width
    menuWidth = computed(() => this.isCollapsed() ? '70px' : '280px');
    
    // Toggle button icon
    toggleIcon = computed(() => this.isCollapsed() ? 'pi-angle-right' : 'pi-angle-left');
    
    // Expose auth state
    user = this.authState.user;
    userDisplayName = this.authState.userDisplayName;
    isAuthenticated = this.authState.isAuthenticated;
    
    // Menu items for expanded state
    expandedItems = computed(() => {
        const baseItems: MenuItem[] = [
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
            },
            {
                label: 'Profile',
                icon: 'pi pi-user',
                routerLink: ['/profile'],
                id: 'panel-menu-profile-link'
            }
        ];
        
        // Add logout item if authenticated
        if (this.isAuthenticated()) {
            baseItems.push({
                separator: true
            });
            baseItems.push({
                label: `Logout (${this.userDisplayName()})`,
                icon: 'pi pi-sign-out',
                command: () => this.authActions.logout(),
                id: 'panel-menu-logout-link'
            });
        }
        
        return baseItems;
    });
    
    // Menu items for collapsed state (icons only)
    collapsedItems = computed(() => {
        const baseItems: MenuItem[] = [
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
            },
            {
                icon: 'pi pi-user',
                routerLink: ['/profile'],
                id: 'panel-menu-profile-link-collapsed',
                title: 'Profile'
            }
        ];
        
        // Add logout item if authenticated
        if (this.isAuthenticated()) {
            baseItems.push({
                icon: 'pi pi-sign-out',
                command: () => this.authActions.logout(),
                id: 'panel-menu-logout-link-collapsed',
                title: `Logout (${this.userDisplayName()})`
            });
        }
        
        return baseItems;
    });
    
    // Current menu items based on state
    menuItems = computed(() => this.isCollapsed() ? this.collapsedItems() : this.expandedItems());

    toggleMenu(): void {
        this.isCollapsed.set(!this.isCollapsed());
    }
    
    handleMenuItemClick(item: MenuItem): void {
        if (item.command) {
            item.command({
                originalEvent: new Event('click'),
                item: item
            });
        }
    }
  }
  