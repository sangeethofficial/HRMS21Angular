/** Flexible shapes from GET /api/Dashboard — map in DashboardService */
export interface DashboardApiEnvelope {
  data?: unknown;
  [key: string]: unknown;
}

export interface SuperadminKpiCard {
  id: string;
  title: string;
  value: string;
  sublabel: string;
  icon: 'people' | 'leave' | 'present' | 'remote' | 'growth' | 'dept' | 'attrition' | 'mrf' | 'billable' | 'client' | 'project' | 'resources';
}

export interface ChartSeriesPoint {
  label: string;
  value: number;
}

export interface MonthlyStackPoint {
  month: string;
  billable: number;
  nonBillable: number;
}

export interface MonthlyTriplePoint {
  month: string;
  openings: number;
  hiring: number;
  exits: number;
}

export interface SuperadminDashboardView {
  kpis: SuperadminKpiCard[];
  lastUpdated: string | null;
  contractTypes: ChartSeriesPoint[];
  interactiveMetrics: MonthlyTriplePoint[];
  headcountTrend: { month: string; headcount: number }[];
  billableStack: MonthlyStackPoint[];
  deptGender: { department: string; male: number; female: number }[];
}

export interface UserPersonalInfo {
  employeeName?: string;
  userName?: string;
  employeeCode?: string;
  email?: string;
  role?: string;
  designation?: string;
  department?: string;
  companyName?: string;
  branch?: string;
  team?: string;
  gradeCode?: string;
  gradeName?: string;
  profileImage?: string;
  profileImageUrl?: string;
  [key: string]: unknown;
}
