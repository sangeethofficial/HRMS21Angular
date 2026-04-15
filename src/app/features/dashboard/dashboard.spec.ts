import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Dashboard } from './dashboard';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService } from '../../core/services/dashboard.service';
import type { SuperadminDashboardView } from '../../core/models/dashboard.models';

const emptyView: SuperadminDashboardView = {
  kpis: [],
  lastUpdated: null,
  contractTypes: [],
  interactiveMetrics: [],
  headcountTrend: [],
  billableStack: [],
  deptGender: [],
};

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            hydrateSessionFromToken: (): void => undefined,
            isSuperAdmin: (): boolean => true,
            getCurrentUserId: (): number => 1,
            logout: (): void => undefined,
          },
        },
        {
          provide: DashboardService,
          useValue: {
            getDashboard: () => of(emptyView),
            getViewUserPersonalInfo: () => of({}),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
