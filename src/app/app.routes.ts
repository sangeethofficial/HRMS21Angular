import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { 
    path: '', 
    redirectTo: '/login', 
    pathMatch: 'full' 
  },
  { 
    path: 'login', 
    loadComponent: () => import('./features/login/login').then(m => m.Login) 
  },
  { 
    path: 'dashboard', 
    loadComponent: () => import('./features/dashboard/dashboard').then(m => m.Dashboard),
    canActivate: [authGuard],
    children: [
      {
        path: 'my-leave',
        loadComponent: () =>
          import('./features/dashboard/submenu-pages/my-leave-page').then((m) => m.MyLeavePageComponent),
      },
      {
        path: 'my-team',
        loadComponent: () =>
          import('./features/dashboard/submenu-pages/my-team-page').then((m) => m.MyTeamPageComponent),
      },
      {
        path: 'goals',
        loadComponent: () =>
          import('./features/dashboard/submenu-pages/goals-page').then((m) => m.GoalsPageComponent),
      },
      {
        path: 'ums',
        loadComponent: () => import('./features/dashboard/submenu-pages/ums-page').then((m) => m.UmsPageComponent),
      },
      {
        path: 'attendance',
        loadComponent: () =>
          import('./features/dashboard/submenu-pages/attendance-page').then((m) => m.AttendancePageComponent),
      },
      {
        path: 'attendance-report',
        loadComponent: () =>
          import('./features/dashboard/submenu-pages/attendance-report-page').then((m) => m.AttendanceReportPageComponent),
      },
      {
        path: 'masters',
        loadComponent: () =>
          import('./features/dashboard/submenu-pages/masters-page').then((m) => m.MastersPageComponent),
      },
      {
        path: 'claims-portal',
        loadComponent: () =>
          import('./features/dashboard/submenu-pages/claims-portal-page').then((m) => m.ClaimsPortalPageComponent),
      },
      {
        path: 'policies',
        loadComponent: () =>
          import('./features/dashboard/submenu-pages/policies-page').then((m) => m.PoliciesPageComponent),
      },
      {
        path: 'engage',
        loadComponent: () =>
          import('./features/dashboard/submenu-pages/engage-page').then((m) => m.EngagePageComponent),
      },
      {
        path: 'tax-declarations',
        loadComponent: () =>
          import('./features/dashboard/submenu-pages/tax-declarations-page').then((m) => m.TaxDeclarationsPageComponent),
      },
      {
        path: 'logs',
        loadComponent: () => import('./features/dashboard/submenu-pages/logs-page').then((m) => m.LogsPageComponent),
      },
      {
        path: 'schedulers',
        loadComponent: () =>
          import('./features/dashboard/submenu-pages/schedulers-page').then((m) => m.SchedulersPageComponent),
      },
      {
        path: 'configuration',
        loadComponent: () =>
          import('./features/dashboard/submenu-pages/configuration-page').then((m) => m.ConfigurationPageComponent),
      },
    ],
  },
  {
    path: 'debug',
    loadComponent: () => import('./features/dashboard/dashboard').then(m => m.Dashboard)
  },
  {
    path: '**',
    redirectTo: '/login'
  }
];
