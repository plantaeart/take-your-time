import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-storage-test',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="position: fixed; top: 10px; right: 10px; background: white; border: 2px solid red; padding: 10px; z-index: 9999;" *ngIf="showDebug">
      <h3>localStorage Debug</h3>
      <p><strong>Available:</strong> {{ storageAvailable }}</p>
      <p><strong>Test Value:</strong> {{ testValue }}</p>
      <p><strong>Auth Token:</strong> {{ authToken ? 'EXISTS' : 'MISSING' }}</p>
      <p><strong>Auth User:</strong> {{ authUser ? 'EXISTS' : 'MISSING' }}</p>
      <button (click)="testStorage()">Test Storage</button>
      <button (click)="clearTest()">Clear Test</button>
      <button (click)="showAll()">Show All Keys</button>
      <div *ngIf="allKeys.length > 0">
        <p><strong>All Keys:</strong></p>
        <ul>
          <li *ngFor="let key of allKeys">{{ key }}</li>
        </ul>
      </div>
    </div>
  `
})
export class StorageTestComponent implements OnInit {
  showDebug = environment.debug;
  storageAvailable = false;
  testValue: string | null = null;
  authToken: string | null = null;
  authUser: string | null = null;
  allKeys: string[] = [];

  ngOnInit() {
    this.checkStorage();
  }

  checkStorage() {
    this.storageAvailable = typeof Storage !== 'undefined';
    
    if (this.storageAvailable) {
      this.testValue = localStorage.getItem('test_value');
      this.authToken = localStorage.getItem('auth_token');
      this.authUser = localStorage.getItem('auth_user');
    }
  }

  testStorage() {
    if (this.storageAvailable) {
      const testData = `Test-${Date.now()}`;
      localStorage.setItem('test_value', testData);
      
      // Immediate check
      const retrieved = localStorage.getItem('test_value');
      
      this.checkStorage();
    }
  }

  clearTest() {
    if (this.storageAvailable) {
      localStorage.removeItem('test_value');
      this.checkStorage();
    }
  }

  showAll() {
    if (this.storageAvailable) {
      this.allKeys = Object.keys(localStorage);
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key || '');
      }
    }
  }
}
