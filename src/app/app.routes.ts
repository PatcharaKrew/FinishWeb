import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { HistoryComponent } from './pages/history/history.component';
import { NotCheckComponent } from './pages/not-check/not-check.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: '/welcome' },
  {
    path: 'welcome',
    loadChildren: () =>
      import('./pages/welcome/welcome.routes').then((m) => m.WELCOME_ROUTES),
  },
  {
    path: 'home', component: HomeComponent, children: [
      { path: '', pathMatch: 'full', redirectTo: 'check' },
      { path: 'check', component: NotCheckComponent },
      { path: 'history', component: HistoryComponent },
      { path: 'dashboard', component: DashboardComponent },
    ]
  },
];

