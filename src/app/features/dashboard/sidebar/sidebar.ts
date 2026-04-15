import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output, signal } from '@angular/core';
import { Router } from '@angular/router';

type SidebarItem = {
  id: string;
  label: string;
  icon: string;
  routePath?: string;
  children?: { label: string; routePath: string }[];
};

@Component({
  selector: 'app-dashboard-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css'],
})
export class DashboardSidebarComponent {
  private router = inject(Router);
  @Input() mobileOpen = false;
  @Output() mobileOpenChange = new EventEmitter<boolean>();

  expandedSections = signal<Record<string, boolean>>({
    leaveTracker: false,
    more: false,
  });

  readonly menuItems: SidebarItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '▦', routePath: '/dashboard' },
    { id: 'home', label: 'Home', icon: '⌂' },
    { id: 'announcement', label: 'Announcement', icon: '📣' },
    {
      id: 'leaveTracker',
      label: 'Leave Tracker',
      icon: '🌴',
      children: [
        { label: 'My Leave', routePath: '/dashboard/my-leave' },
        { label: 'My Team', routePath: '/dashboard/my-team' },
      ],
    },
    { id: 'people', label: 'People', icon: '👥' },
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'talentAcquisition', label: 'Talent Acquisition', icon: '🔎' },
    {
      id: 'more',
      label: 'More',
      icon: '⋯',
      children: [
        { label: 'Goals', routePath: '/dashboard/goals' },
        { label: 'UMS', routePath: '/dashboard/ums' },
        { label: 'Attendance', routePath: '/dashboard/attendance' },
        { label: 'Attendance Report', routePath: '/dashboard/attendance-report' },
        { label: 'Masters', routePath: '/dashboard/masters' },
        { label: 'Claims Portal', routePath: '/dashboard/claims-portal' },
        { label: 'Policies', routePath: '/dashboard/policies' },
        { label: 'Engage', routePath: '/dashboard/engage' },
        { label: 'Tax Declarations', routePath: '/dashboard/tax-declarations' },
        { label: 'logs', routePath: '/dashboard/logs' },
        { label: 'Schedulers', routePath: '/dashboard/schedulers' },
        { label: 'Configuration', routePath: '/dashboard/configuration' },
      ],
    },
  ];

  isExpanded(sectionId: string): boolean {
    const item = this.menuItems.find((x) => x.id === sectionId);
    if (item?.children?.some((x) => this.isSubItemActive(x.routePath))) return true;
    return !!this.expandedSections()[sectionId];
  }

  onItemClick(item: SidebarItem): void {
    if (item.children?.length) {
      this.expandedSections.update((state) => ({
        ...state,
        [item.id]: !state[item.id],
      }));
      return;
    }

    if (item.routePath) {
      this.router.navigateByUrl(item.routePath);
    }
    this.closeMobile();
  }

  onSubItemClick(routePath: string): void {
    this.router.navigateByUrl(routePath);
    this.closeMobile();
  }

  isItemActive(item: SidebarItem): boolean {
    if (item.id === 'dashboard') return this.router.url.startsWith('/dashboard');
    if (item.children?.length) return item.children.some((x) => this.isSubItemActive(x.routePath));
    if (!item.routePath) return false;
    return this.router.url === item.routePath;
  }

  isSubItemActive(routePath: string): boolean {
    return this.router.url === routePath;
  }

  closeMobile(): void {
    if (!this.mobileOpen) return;
    this.mobileOpenChange.emit(false);
  }
}
