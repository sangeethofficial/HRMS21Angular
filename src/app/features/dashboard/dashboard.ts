import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { SuperadminDashboardComponent } from './superadmin-dashboard/superadmin-dashboard';
import type { SuperadminDashboardView, UserPersonalInfo } from '../../core/models/dashboard.models';
import { UserDashboardComponent } from './user-dashboard/user-dashboard';
import { DashboardSidebarComponent } from './sidebar/sidebar';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterOutlet, DashboardSidebarComponent, SuperadminDashboardComponent, UserDashboardComponent],
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
  mobileSidebarOpen = false;

  isSuperAdmin = signal(false);

  displayName = computed(() => {
    const p = this.profile();
    if (p) {
      const n = (p['employeeName'] ?? p['userName'] ?? p['fullName'] ?? p['name']) as string | undefined;
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

  profileImageUrl = computed(() => {
    const p = this.profile();
    const raw = (p?.['profileImage'] ?? p?.['profileImageUrl'] ?? p?.['photoUrl']) as
      | string
      | undefined;
    if (!raw) return null;
    try {
      return encodeURI(String(raw));
    } catch {
      return String(raw);
    }
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

  hasSubmenuRoute(): boolean {
    return this.router.url.startsWith('/dashboard/');
  }

  toggleMobileSidebar(): void {
    this.mobileSidebarOpen = !this.mobileSidebarOpen;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
