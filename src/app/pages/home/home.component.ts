import { Component, inject } from '@angular/core';
import { NgZorroModule } from '../../../shared/ng-zorro.module';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [NgZorroModule,CommonModule,FormsModule,RouterOutlet],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  private router = inject(Router);

  navigateToCheck() {
    console.log('Navigating to check');
    this.router.navigate(['/home/check']);
  }

  navigateToDashboard() {
    console.log('Navigating to check');
    this.router.navigate(['/home/dashboard']);
  }

  navigateToHistory() {
    console.log('Navigating to /home/history');
    this.router.navigate(['/home/history']).then(() => {
      console.log('Navigation successful');
    }).catch(err => {
      console.error('Navigation error:', err);
    });
  }


  logout(): void {
    console.log('User logged out');
    this.router.navigate(['/welcome']);
  }
}
