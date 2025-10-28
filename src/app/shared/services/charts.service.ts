import { Injectable, signal } from '@angular/core';
import { ChartData } from '../components/charts/line-chart/line-chart.component';
import { DonutChartData } from '../components/charts/donut-chart/donut-chart.component';
import { BarChartData } from '../components/charts/bar-chart/bar-chart.component';
import { AreaChartData } from '../components/charts/area-chart/area-chart.component';

export interface ChartDataSets {
  userGrowth: ChartData;
  systemMetricsOverTime: ChartData;
  revenueChart: AreaChartData;
  storageUsage: DonutChartData;
  userActivityByHour: BarChartData;
  documentsByType: DonutChartData;
  responseTimeChart: ChartData;
  serverLoad: AreaChartData;
}

@Injectable({
  providedIn: 'root'
})
export class ChartsService {
  private chartData = signal<ChartDataSets | null>(null);

  constructor() {
    this.generateChartData();
  }

  getChartData() {
    return this.chartData;
  }

  async refreshChartData(): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    this.generateChartData();
  }

  private generateChartData(): void {
    const now = new Date();
    const chartData: ChartDataSets = {
      userGrowth: this.generateUserGrowthData(),
      systemMetricsOverTime: this.generateSystemMetricsData(),
      revenueChart: this.generateRevenueData(),
      storageUsage: this.generateStorageUsageData(),
      userActivityByHour: this.generateUserActivityData(),
      documentsByType: this.generateDocumentTypesData(),
      responseTimeChart: this.generateResponseTimeData(),
      serverLoad: this.generateServerLoadData()
    };

    this.chartData.set(chartData);
  }

  private generateUserGrowthData(): ChartData {
    const labels = this.getLast30Days();
    const totalUsers = this.generateTrendData(12000, 15248, 30, 0.15);
    const activeUsers = this.generateTrendData(7000, 8932, 30, 0.12);

    return {
      labels,
      datasets: [
        {
          label: 'Total Users',
          data: totalUsers,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 3,
          fill: false,
          tension: 0.4
        },
        {
          label: 'Active Users',
          data: activeUsers,
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 3,
          fill: false,
          tension: 0.4
        }
      ]
    };
  }

  private generateSystemMetricsData(): ChartData {
    const labels = this.getLast24Hours();
    const cpuUsage = this.generateRandomData(45, 85, 24);
    const memoryUsage = this.generateRandomData(60, 90, 24);
    const diskUsage = this.generateRandomData(35, 55, 24);

    return {
      labels,
      datasets: [
        {
          label: 'CPU Usage (%)',
          data: cpuUsage,
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderWidth: 2,
          fill: false,
          tension: 0.4
        },
        {
          label: 'Memory Usage (%)',
          data: memoryUsage,
          borderColor: 'rgb(245, 158, 11)',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          borderWidth: 2,
          fill: false,
          tension: 0.4
        },
        {
          label: 'Disk Usage (%)',
          data: diskUsage,
          borderColor: 'rgb(139, 92, 246)',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          borderWidth: 2,
          fill: false,
          tension: 0.4
        }
      ]
    };
  }

  private generateRevenueData(): AreaChartData {
    const labels = this.getLast12Months();
    const revenue = this.generateTrendData(80000, 127450, 12, 0.08);

    return {
      labels,
      datasets: [
        {
          label: 'Monthly Revenue ($)',
          data: revenue,
          backgroundColor: 'rgba(34, 197, 94, 0.2)',
          borderColor: 'rgb(34, 197, 94)',
          borderWidth: 3,
          fill: true,
          tension: 0.4
        }
      ]
    };
  }

  private generateStorageUsageData(): DonutChartData {
    return {
      labels: ['Documents', 'Images', 'Videos', 'Other', 'Free Space'],
      datasets: [
        {
          label: 'Storage Usage',
          data: [1200, 450, 380, 280, 1690], // GB
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(139, 92, 246, 0.8)',
            'rgba(156, 163, 175, 0.3)'
          ],
          borderColor: [
            'rgb(59, 130, 246)',
            'rgb(16, 185, 129)',
            'rgb(245, 158, 11)',
            'rgb(139, 92, 246)',
            'rgb(156, 163, 175)'
          ],
          borderWidth: 2
        }
      ]
    };
  }

  private generateUserActivityData(): BarChartData {
    const labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    const loginActivity = this.generateRandomData(50, 800, 24);
    const documentActivity = this.generateRandomData(30, 600, 24);

    return {
      labels,
      datasets: [
        {
          label: 'Logins',
          data: loginActivity,
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1
        },
        {
          label: 'Document Activity',
          data: documentActivity,
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
          borderColor: 'rgb(16, 185, 129)',
          borderWidth: 1
        }
      ]
    };
  }

  private generateDocumentTypesData(): DonutChartData {
    return {
      labels: ['PDF', 'Word Docs', 'Spreadsheets', 'Presentations', 'Images', 'Other'],
      datasets: [
        {
          label: 'Document Types',
          data: [45890, 32450, 21340, 15670, 8210, 1007],
          backgroundColor: [
            'rgba(239, 68, 68, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(139, 92, 246, 0.8)',
            'rgba(156, 163, 175, 0.8)'
          ],
          borderColor: [
            'rgb(239, 68, 68)',
            'rgb(59, 130, 246)',
            'rgb(16, 185, 129)',
            'rgb(245, 158, 11)',
            'rgb(139, 92, 246)',
            'rgb(156, 163, 175)'
          ],
          borderWidth: 2
        }
      ]
    };
  }

  private generateResponseTimeData(): ChartData {
    const labels = this.getLast24Hours();
    const responseTime = this.generateRandomData(80, 250, 24);

    return {
      labels,
      datasets: [
        {
          label: 'Response Time (ms)',
          data: responseTime,
          borderColor: 'rgb(236, 72, 153)',
          backgroundColor: 'rgba(236, 72, 153, 0.1)',
          borderWidth: 3,
          fill: false,
          tension: 0.4
        }
      ]
    };
  }

  private generateServerLoadData(): AreaChartData {
    const labels = this.getLast7Days();
    const serverLoad = this.generateRandomData(20, 80, 7);

    return {
      labels,
      datasets: [
        {
          label: 'Server Load (%)',
          data: serverLoad,
          backgroundColor: 'rgba(99, 102, 241, 0.3)',
          borderColor: 'rgb(99, 102, 241)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        }
      ]
    };
  }

  // Utility methods for generating data
  private getLast30Days(): string[] {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    }
    return days;
  }

  private getLast7Days(): string[] {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
    }
    return days;
  }

  private getLast24Hours(): string[] {
    const hours = [];
    for (let i = 23; i >= 0; i--) {
      const date = new Date();
      date.setHours(date.getHours() - i);
      hours.push(date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    }
    return hours;
  }

  private getLast12Months(): string[] {
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      months.push(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
    }
    return months;
  }

  private generateRandomData(min: number, max: number, count: number): number[] {
    return Array.from({ length: count }, () =>
      Math.floor(Math.random() * (max - min + 1)) + min
    );
  }

  private generateTrendData(start: number, end: number, count: number, volatility: number): number[] {
    const data = [];
    const increment = (end - start) / (count - 1);

    for (let i = 0; i < count; i++) {
      const baseValue = start + (increment * i);
      const variation = baseValue * volatility * (Math.random() - 0.5);
      data.push(Math.round(baseValue + variation));
    }

    return data;
  }
}
