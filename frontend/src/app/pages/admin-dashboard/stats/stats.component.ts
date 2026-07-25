import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';
import { Stats, DailyStats, MonthlyStats } from '../../../models/brew-and-leaf.models';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.scss']
})
export class StatsComponent implements OnInit, AfterViewInit {
  stats: Stats = {
    total_revenue: 0,
    today_revenue: 0,
    total_cost: 0,
    total_margin: 0,
    total_profit: 0,
    today_cost: 0,
    today_margin: 0,
    today_profit: 0,
    current_month_revenue: 0,
    current_month_cost: 0,
    current_month_margin: 0,
    current_month_profit: 0,
    total_orders: 0,
    today_orders: 0,
    total_products: 0,
    total_inventory: 0,
    total_credit: 0,
    total_debit: 0
  };

  dailyStats: DailyStats[] = [];
  monthlyStats: MonthlyStats[] = [];

  @ViewChild('salesChart') salesChartRef!: ElementRef<HTMLCanvasElement>;
  private salesChart?: Chart;
  private pendingChartData: DailyStats[] = [];

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadStats();
  }

  ngAfterViewInit(): void {
    if (this.pendingChartData.length) {
      this.renderChart(this.pendingChartData);
    }
  }

  loadStats(): void {
    this.apiService.getSummaryStats().subscribe(data => {
      this.stats = data;
    });

    this.initChart();
    this.apiService.getMonthlyStats({ limit: 12 }).subscribe(data => {
      this.monthlyStats = data;
    });
  }

  initChart(): void {
    this.apiService.getDailyStats().subscribe(data => {
      this.dailyStats = data;
      this.pendingChartData = data;
      this.renderChart(data);
    });
  }

  private renderChart(data: DailyStats[]): void {
    if (!this.salesChartRef?.nativeElement) {
      return;
    }

    const ctx = this.salesChartRef.nativeElement.getContext('2d');
    if (!ctx) {
      return;
    }

    this.salesChart?.destroy();
    this.salesChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map(d => d.date),
        datasets: [
          {
            label: 'Daily Sales',
            data: data.map(d => d.total_sales || 0),
            borderColor: '#4B3621',
            backgroundColor: 'rgba(75, 54, 33, 0.1)',
            fill: true,
            tension: 0.4
          },
          {
            label: 'Daily Cost',
            data: data.map(d => d.total_cost || 0),
            borderColor: '#9b6b3f',
            backgroundColor: 'rgba(155, 107, 63, 0.08)',
            fill: true,
            tension: 0.4
          },
          {
            label: 'Daily Profit',
            data: data.map(d => d.total_profit || 0),
            borderColor: '#00704A',
            backgroundColor: 'rgba(0, 112, 74, 0.1)',
            fill: true,
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { 
            display: true,
            position: 'top'
          }
        }
      }
    });
  }
}
