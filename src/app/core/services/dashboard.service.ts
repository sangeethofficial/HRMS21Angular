import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  SuperadminDashboardView,
  UserPersonalInfo,
  ChartSeriesPoint,
  MonthlyStackPoint,
  MonthlyTriplePoint,
  SuperadminKpiCard,
} from '../models/dashboard.models';

function apiBase(): string {
  const e = environment as { apiBaseUrl?: string; apiUrl?: string };
  return e.apiBaseUrl ?? e.apiUrl ?? '';
}

function unwrap(res: unknown): Record<string, unknown> {
  if (res && typeof res === 'object' && 'data' in (res as object)) {
    const d = (res as { data: unknown }).data;
    if (d && typeof d === 'object') return d as Record<string, unknown>;
  }
  return (res && typeof res === 'object' ? res : {}) as Record<string, unknown>;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function num(r: Record<string, unknown>, keys: string[]): number {
  for (const k of keys) {
    const v = r[k];
    if (typeof v === 'number' && !Number.isNaN(v)) return v;
    if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) return Number(v);
  }
  return 0;
}

function str(r: Record<string, unknown>, keys: string[], fallback = ''): string {
  for (const k of keys) {
    const v = r[k];
    if (v !== undefined && v !== null) return String(v);
  }
  return fallback;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);

  getDashboard(params?: { year?: number; compareWith?: string }): Observable<SuperadminDashboardView> {
    let hp = new HttpParams();
    if (params?.year != null) hp = hp.set('year', String(params.year));
    if (params?.compareWith != null && params.compareWith !== 'none') {
      hp = hp.set('compareWith', params.compareWith);
    }
    const url = `${apiBase()}/Dashboard`;
    return this.http.get<unknown>(url, { params: hp }).pipe(map((res) => mapDashboardResponse(res)));
  }

  getViewUserPersonalInfo(userId: number): Observable<UserPersonalInfo> {
    const url = `${apiBase()}/user-management/view-user-personal-info/${userId}`;
    return this.http.get<unknown>(url).pipe(map((res) => mapUserPersonalInfo(res)));
  }
}

function mapUserPersonalInfo(res: unknown): UserPersonalInfo {
  const r = unwrap(res);
  return {
    ...r,
    employeeName: str(r, ['employeeName', 'userName', 'fullName', 'name'], ''),
    employeeCode: str(r, ['employeeCode', 'empCode'], ''),
    profileImage: str(r, ['profileImage', 'profileImageUrl', 'photoUrl'], ''),
    profileImageUrl: str(r, ['profileImageUrl', 'profileImage', 'photoUrl'], ''),
    email: str(r, ['email'], ''),
    role: str(r, ['role'], ''),
    designation: str(r, ['designation'], ''),
    department: str(r, ['department'], ''),
    companyName: str(r, ['companyName'], ''),
    branch: str(r, ['branch'], ''),
    team: str(r, ['team'], ''),
    gradeCode: str(r, ['gradeCode'], ''),
    gradeName: str(r, ['gradeName'], ''),
  };
}

function mapDashboardResponse(res: unknown): SuperadminDashboardView {
  const r = unwrap(res);
  const summary = asRecord(r['summary']);
  const metrics = { ...r, ...summary };

  const mrfOpen = num(metrics, ['mrfOpen', 'mrfOpenCount', 'openMrf']);
  const mrfClosed = num(metrics, ['mrfClosed', 'mrfClosedCount', 'closedMrf']);

  const kpis = buildKpiCards(metrics, mrfOpen, mrfClosed);

  const lu = str(metrics, ['lastUpdated', 'lastUpdatedAt', 'updatedAt'], '');
  return {
    kpis,
    lastUpdated: lu || null,
    contractTypes: mapContractTypes(r),
    interactiveMetrics: mapInteractiveMetrics(r),
    headcountTrend: mapHeadcountTrend(r),
    billableStack: mapBillableStack(r),
    deptGender: mapDeptGender(r),
  };
}

function buildKpiCards(
  r: Record<string, unknown>,
  mrfOpen: number,
  mrfClosed: number,
): SuperadminKpiCard[] {
  const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));
  return [
    {
      id: 'totalEmployees',
      title: 'Total Employees',
      value: fmt(num(r, ['totalEmployees', 'totalEmployeeCount', 'employeeCount'])),
      sublabel: 'in company',
      icon: 'people',
    },
    {
      id: 'onLeaveToday',
      title: 'On Leave Today',
      value: fmt(num(r, ['onLeaveToday', 'leaveToday', 'employeesOnLeaveToday'])),
      sublabel: 'Today',
      icon: 'leave',
    },
    {
      id: 'presentToday',
      title: 'Present Today',
      value: fmt(num(r, ['presentToday', 'attendancePresentToday'])),
      sublabel: 'Today',
      icon: 'present',
    },
    {
      id: 'remoteWorkers',
      title: 'Remote Workers',
      value: fmt(num(r, ['remoteWorkers', 'remoteToday', 'workFromHomeToday'])),
      sublabel: 'Today',
      icon: 'remote',
    },
    {
      id: 'headcountGrowth',
      title: 'Headcount Growth',
      value: `${fmt(num(r, ['headcountGrowthPercent', 'headcountGrowth', 'yoyHeadcountGrowth']))}%`,
      sublabel: 'vs Last Year',
      icon: 'growth',
    },
    {
      id: 'activeDepartments',
      title: 'Active Departments',
      value: fmt(num(r, ['activeDepartments', 'departmentCount', 'departments'])),
      sublabel: 'in company',
      icon: 'dept',
    },
    {
      id: 'attritionRate',
      title: 'Attrition Rate',
      value: fmt(num(r, ['attritionRate', 'attrition', 'attritionPercent'])),
      sublabel: 'in company',
      icon: 'attrition',
    },
    {
      id: 'mrf',
      title: 'MRF Request',
      value: fmt(num(r, ['mrfRequest', 'mrfTotal', 'mrfCount'])),
      sublabel: `${mrfOpen} open / ${mrfClosed} closed`,
      icon: 'mrf',
    },
    {
      id: 'billable',
      title: 'Billable',
      value: fmt(num(r, ['billable', 'billableResources', 'billableCount'])),
      sublabel: 'resources',
      icon: 'billable',
    },
    {
      id: 'nonBillable',
      title: 'Non Billable',
      value: fmt(num(r, ['nonBillable', 'nonBillableResources', 'nonBillableCount'])),
      sublabel: 'resources',
      icon: 'billable',
    },
    {
      id: 'activeClients',
      title: 'Active Clients',
      value: fmt(num(r, ['activeClients', 'clientCount'])),
      sublabel: 'clients',
      icon: 'client',
    },
    {
      id: 'activeProjects',
      title: 'Active Projects',
      value: fmt(num(r, ['activeProjects', 'projectCount'])),
      sublabel: 'projects',
      icon: 'project',
    },
    {
      id: 'resourcesInProjects',
      title: 'Resources in Projects',
      value: fmt(num(r, ['resourcesInProjects', 'resourcesOnProjects'])),
      sublabel: 'resources',
      icon: 'resources',
    },
  ];
}

function mapContractTypes(r: Record<string, unknown>): ChartSeriesPoint[] {
  const raw = r['contractTypes'] ?? r['contractTypeBreakdown'];
  if (Array.isArray(raw)) {
    return raw
      .map((x) => {
        if (!x || typeof x !== 'object') return null;
        const o = x as Record<string, unknown>;
        return {
          label: str(o, ['label', 'name', 'type'], '—'),
          value: num(o, ['value', 'count', 'total']),
        };
      })
      .filter((x): x is ChartSeriesPoint => x !== null);
  }
  return [
    { label: 'Full Time (Probation)', value: num(r, ['probationCount']) },
    { label: 'Temp Users', value: num(r, ['tempUserCount']) },
    { label: 'Full Time', value: num(r, ['fullTimeCount']) },
  ].filter((x) => x.value > 0);
}

function mapInteractiveMetrics(r: Record<string, unknown>): MonthlyTriplePoint[] {
  const raw = r['interactiveMetrics'] ?? r['monthlyHiringMetrics'] ?? r['hiringMetrics'];
  if (Array.isArray(raw)) {
    return raw
      .map((x) => {
        if (!x || typeof x !== 'object') return null;
        const o = x as Record<string, unknown>;
        return {
          month: str(o, ['month', 'label', 'name'], ''),
          openings: num(o, ['openings', 'opening']),
          hiring: num(o, ['hiring', 'hires']),
          exits: num(o, ['exits', 'exit']),
        };
      })
      .filter((x): x is MonthlyTriplePoint => x !== null && x.month !== '');
  }
  return [];
}

function mapHeadcountTrend(r: Record<string, unknown>): { month: string; headcount: number }[] {
  const raw = r['headcountTrend'] ?? r['companyGrowth'] ?? r['monthlyHeadcount'];
  if (Array.isArray(raw)) {
    return raw
      .map((x) => {
        if (!x || typeof x !== 'object') return null;
        const o = x as Record<string, unknown>;
        return {
          month: str(o, ['month', 'label'], ''),
          headcount: num(o, ['headcount', 'count', 'value']),
        };
      })
      .filter((x): x is { month: string; headcount: number } => x !== null && x.month !== '');
  }
  return [];
}

function mapBillableStack(r: Record<string, unknown>): MonthlyStackPoint[] {
  const raw = r['billableVsNonBillable'] ?? r['monthlyBillable'] ?? r['billableStack'];
  if (Array.isArray(raw)) {
    return raw
      .map((x) => {
        if (!x || typeof x !== 'object') return null;
        const o = x as Record<string, unknown>;
        return {
          month: str(o, ['month', 'label'], ''),
          billable: num(o, ['billable', 'billableCount']),
          nonBillable: num(o, ['nonBillable', 'nonBillableCount']),
        };
      })
      .filter((x): x is MonthlyStackPoint => x !== null && x.month !== '');
  }
  return [];
}

function mapDeptGender(r: Record<string, unknown>): { department: string; male: number; female: number }[] {
  const raw = r['departmentGender'] ?? r['deptGenderDistribution'];
  if (Array.isArray(raw)) {
    return raw
      .map((x) => {
        if (!x || typeof x !== 'object') return null;
        const o = x as Record<string, unknown>;
        return {
          department: str(o, ['department', 'name', 'label'], ''),
          male: num(o, ['male', 'maleCount', 'males']),
          female: num(o, ['female', 'femaleCount', 'females']),
        };
      })
      .filter((x): x is { department: string; male: number; female: number } => x !== null && x.department !== '');
  }
  return [];
}
