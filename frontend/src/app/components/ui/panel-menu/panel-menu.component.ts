import {
    Component,
  } from "@angular/core";
import { MenuItem } from "primeng/api";
  import { PanelMenuModule } from 'primeng/panelmenu';
  
  @Component({
    selector: "app-panel-menu",
    standalone: true,
    imports: [PanelMenuModule],
    template: `
        <p-panelMenu [model]="items" styleClass="w-full" />
    `
  })
  export class PanelMenuComponent {

    public readonly items: MenuItem[] = [
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
    ]
  }
  