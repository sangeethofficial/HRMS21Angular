import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { SuperadminDashboardComponent } from './superadmin-dashboard/superadmin-dashboard';
import type { SuperadminDashboardView, UserPersonalInfo } from '../../core/models/dashboard.models';
import { UserDashboardComponent } from './user-dashboard/user-dashboard';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, SuperadminDashboardComponent, UserDashboardComponent],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class Dashboard implements OnInit {
  private authService = inject(AuthService);
  private dashboardService = inject(DashboardService);
  private router = inject(Router);

  year = signal(new Date().getFullYear());
  compareWith = signal('none');
  loading = signal(true);
  superVm = signal<SuperadminDashboardView | null>(null);
  profile = signal<UserPersonalInfo | null>(null);

  isSuperAdmin = signal(false);

  displayName = computed(() => {
    const p = this.profile();
    if (p) {
      const n = (p['employeeName'] ?? p['fullName'] ?? p['name']) as string | undefined;
      if (n) return String(n);
    }
    return 'User';
  });

  employeeCode = computed(() => {
    const p = this.profile();
    if (p) {
      const c = (p['employeeCode'] ?? p['empCode']) as string | undefined;
      if (c) return String(c);
    }
    return '—';
  });

  notificationCount = computed(() => {
    const p = this.profile();
    const n = p?.['notificationCount'] ?? p?.['unreadNotifications'];
    if (typeof n === 'number') return n;
    return 0;
  });

  ngOnInit(): void {
    this.authService.hydrateSessionFromToken();
    this.isSuperAdmin.set(this.authService.isSuperAdmin());
    this.load();
  }

  load(): void {
    this.loading.set(true);
    const uid = this.authService.getCurrentUserId();

    const dash$ = this.dashboardService
      .getDashboard({ year: this.year(), compareWith: this.compareWith() })
      .pipe(catchError(() => of(null)));

    const profile$ =
      uid != null
        ? this.dashboardService.getViewUserPersonalInfo(uid).pipe(catchError(() => of(null)))
        : of(null);

    forkJoin({ dash: dash$, profile: profile$ }).subscribe({
      next: ({ dash, profile }) => {
        this.superVm.set(dash);
        this.profile.set(profile);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  onYearChange(y: number): void {
    this.year.set(y);
    this.load();
  }

  onCompareChange(v: string): void {
    this.compareWith.set(v);
    this.load();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
