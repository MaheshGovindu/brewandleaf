import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';
import { Stats, DailyStats } from '../../../models/brew-and-leaf.models';
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
    total_orders: 0,
    today_orders: 0,
    total_products: 0,
    total_inventory: 0,
    total_credit: 0,
    total_debit: 0
  };

  dailyStats: DailyStats[] = [];

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
            label: 'Daily Revenue',
            data: data.map(d => d.total_sales || 0),
            borderColor: '#4B3621',
            backgroundColor: 'rgba(75, 54, 33, 0.1)',
            fill: true,
            tension: 0.4
          },
          {
            label: 'Total Credit',
            data: data.map(d => d.total_credit || 0),
            borderColor: '#00704A',
            backgroundColor: 'rgba(0, 112, 74, 0.1)',
            fill: true,
            tension: 0.4
          },
          {
            label: 'Total Debit',
            data: data.map(d => d.total_debit || 0),
            borderColor: '#9E2323',
            backgroundColor: 'rgba(158, 35, 35, 0.1)',
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
