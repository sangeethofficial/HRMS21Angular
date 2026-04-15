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
      (p?.['userName'] as string) ??
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
    const u =
      (p?.['profileImage'] as string) ??
      (p?.['profileImageUrl'] as string) ??
      (p?.['photoUrl'] as string);
    if (!u) return null;
    try {
      return encodeURI(String(u));
    } catch {
      return String(u);
    }
  }

  profileDetail(label: string): string {
    const p = this.profile;
    if (!p) return '—';
    const keyMap: Record<string, string[]> = {
      Email: ['email'],
      Role: ['role'],
      Designation: ['designation'],
      Department: ['department'],
      Company: ['companyName'],
      Branch: ['branch'],
      Team: ['team'],
      Grade: ['gradeName', 'gradeCode'],
    };
    const keys = keyMap[label] ?? [];
    for (const key of keys) {
      const value = p[key];
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        return String(value);
      }
    }
    return '—';
  }
}
