import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnDestroy,
  AfterViewInit,
  OnChanges,
  SimpleChanges,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import type { SuperadminDashboardView } from '../../../core/models/dashboard.models';

Chart.register(...registerables);

@Component({
  selector: 'app-superadmin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './superadmin-dashboard.html',
  styleUrl: './superadmin-dashboard.css',
})
export class SuperadminDashboardComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() vm: SuperadminDashboardView | null = null;
  @Input() loading = false;

  @Input() selectedYear = new Date().getFullYear();
  @Input() compareWith = 'none';

  @Output() yearChange = new EventEmitter<number>();
  @Output() compareChange = new EventEmitter<string>();

  @ViewChild('contractCanvas') private contractCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('metricsCanvas') private metricsCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('headcountCanvas') private headcountCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('billableCanvas') private billableCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('deptGenderCanvas') private deptGenderCanvas?: ElementRef<HTMLCanvasElement>;

  private charts: Chart[] = [];

  readonly compareOptions = [
    { value: 'none', label: 'None' },
    { value: 'lastYear', label: 'Last year' },
    { value: 'lastQuarter', label: 'Last quarter' },
  ];

  readonly yearOptions = this.buildYearOptions();

  private buildYearOptions(): number[] {
    const y = new Date().getFullYear();
    return [y - 2, y - 1, y, y + 1];
  }

  ngAfterViewInit(): void {
    this.scheduleRender();
  }

  ngOnChanges(_changes: SimpleChanges): void {
    this.scheduleRender();
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  private scheduleRender(): void {
    queueMicrotask(() => this.renderCharts());
  }

  private destroyCharts(): void {
    for (const c of this.charts) {
      try {
        c.destroy();
      } catch {
        /* ignore */
      }
    }
    this.charts = [];
  }

  private renderCharts(): void {
    this.destroyCharts();
    if (!this.vm) return;

    const contractEl = this.contractCanvas?.nativeElement;
    if (contractEl && this.vm.contractTypes.length) {
      const labels = this.vm.contractTypes.map((x) => x.label);
      const data = this.vm.contractTypes.map((x) => x.value);
      const total = data.reduce((a, b) => a + b, 0);
      if (total > 0) {
        this.charts.push(
          new Chart(contractEl, {
            type: 'doughnut',
            data: {
              labels,
              datasets: [
                {
                  data,
                  backgroundColor: ['#4A90E2', '#FF9F74', '#52C41A', '#B37FEB', '#FFD666'],
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { position: 'right' } },
            },
          }),
        );
      }
    }

    const metricsEl = this.metricsCanvas?.nativeElement;
    if (metricsEl && this.vm.interactiveMetrics.length) {
      const labels = this.vm.interactiveMetrics.map((m) => m.month);
      this.charts.push(
        new Chart(metricsEl, {
          type: 'bar',
          data: {
            labels,
            datasets: [
              { label: 'Openings', data: this.vm.interactiveMetrics.map((m) => m.openings), backgroundColor: '#4A90E2' },
              { label: 'Hiring', data: this.vm.interactiveMetrics.map((m) => m.hiring), backgroundColor: '#FF9F74' },
              { label: 'Exits', data: this.vm.interactiveMetrics.map((m) => m.exits), backgroundColor: '#FF6B6B' },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { x: { stacked: false }, y: { beginAtZero: true } },
          },
        }),
      );
    }

    const headEl = this.headcountCanvas?.nativeElement;
    if (headEl && this.vm.headcountTrend.length) {
      this.charts.push(
        new Chart(headEl, {
          type: 'line',
          data: {
            labels: this.vm.headcountTrend.map((h) => h.month),
            datasets: [
              {
                label: 'Headcount',
                data: this.vm.headcountTrend.map((h) => h.headcount),
                borderColor: '#69C0FF',
                backgroundColor: 'rgba(105,192,255,0.15)',
                fill: true,
                tension: 0.3,
              },
            ],
          },
          options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: false } } },
        }),
      );
    }

    const billEl = this.billableCanvas?.nativeElement;
    if (billEl && this.vm.billableStack.length) {
      const labels = this.vm.billableStack.map((b) => b.month);
      this.charts.push(
        new Chart(billEl, {
          type: 'bar',
          data: {
            labels,
            datasets: [
              {
                label: 'Billable',
                data: this.vm.billableStack.map((b) => b.billable),
                backgroundColor: '#4A90E2',
                stack: 's',
              },
              {
                label: 'Non-Billable',
                data: this.vm.billableStack.map((b) => b.nonBillable),
                backgroundColor: '#FF9F74',
                stack: 's',
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } },
          },
        }),
      );
    }

    const dgEl = this.deptGenderCanvas?.nativeElement;
    if (dgEl && this.vm.deptGender.length) {
      const labels = this.vm.deptGender.map((d) => d.department);
      this.charts.push(
        new Chart(dgEl, {
          type: 'bar',
          data: {
            labels,
            datasets: [
              { label: 'Male', data: this.vm.deptGender.map((d) => d.male), backgroundColor: '#4A90E2' },
              { label: 'Female', data: this.vm.deptGender.map((d) => d.female), backgroundColor: '#FF9F74' },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true } },
          },
        }),
      );
    }
  }

  contractTotal(): number {
    if (!this.vm?.contractTypes.length) return 0;
    return this.vm.contractTypes.reduce((s, x) => s + x.value, 0);
  }

  lastUpdatedDisplay(): string {
    if (this.vm?.lastUpdated) return this.vm.lastUpdated;
    return new Date().toLocaleString();
  }

  onYearChange(ev: Event): void {
    const v = Number((ev.target as HTMLSelectElement).value);
    if (!Number.isNaN(v)) this.yearChange.emit(v);
  }

  onCompareChange(ev: Event): void {
    this.compareChange.emit((ev.target as HTMLSelectElement).value);
  }

  iconClass(icon: string): string {
    return 'kpi-icon kpi-icon--' + icon;
  }
}
