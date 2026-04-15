import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { UserPersonalInfo } from '../../../core/models/dashboard.models';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-dashboard.html',
  styleUrl: './user-dashboard.css',
})
export class UserDashboardComponent {
  @Input() profile: UserPersonalInfo | null = null;
  @Input() loading = false;

  tab: 'overview' | 'whatsnew' | 'notifications' = 'overview';
  innerTab: 'activities' | 'announcement' = 'activities';

  displayName(): string {
    const p = this.profile;
    const n =
      (p?.['employeeName'] as string) ??
      (p?.['fullName'] as string) ??
      (p?.['name'] as string) ??
      'Colleague';
    return String(n);
  }

  employeeCode(): string {
    const p = this.profile;
    const c = (p?.['employeeCode'] as string) ?? (p?.['empCode'] as string) ?? '';
    return String(c || '—');
  }

  avatarUrl(): string | null {
    const p = this.profile;
    const u = (p?.['profileImageUrl'] as string) ?? (p?.['photoUrl'] as string);
    return u ? String(u) : null;
  }
}
