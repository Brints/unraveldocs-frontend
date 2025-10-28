import { Component, Input, OnInit, ViewChild, ElementRef, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';

Chart.register(...registerables);

export interface BarChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }[];
}

@Component({
  selector: 'app-bar-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-container">
      <canvas #chartCanvas></canvas>
    </div>
  `,
  styles: [`
    .chart-container {
      position: relative;
      height: 300px;
      width: 100%;
    }

    canvas {
      max-height: 100%;
      max-width: 100%;
    }
  `]
})
export class BarChartComponent implements OnInit {
  @ViewChild('chartCanvas', { static: true }) chartCanvas!: ElementRef<HTMLCanvasElement>;
  @Input() data = signal<BarChartData>({ labels: [], datasets: [] });
  @Input() title = signal('');
  @Input() horizontal = signal(false);
  @Input() stacked = signal(false);

  private chart: Chart | null = null;

  constructor() {
    effect(() => {
      if (this.chart) {
        this.updateChart();
      }
    });
  }

  ngOnInit() {
    this.initChart();
  }

  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  private initChart() {
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: this.horizontal() ? 'bar' : 'bar' as ChartType,
      data: this.data(),
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: this.horizontal() ? 'y' : 'x',
        plugins: {
          title: {
            display: !!this.title(),
            text: this.title(),
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          legend: {
            position: 'top'
          }
        },
        scales: {
          x: {
            stacked: this.stacked(),
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            }
          },
          y: {
            stacked: this.stacked(),
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            }
          }
        }
      }
    };

    this.chart = new Chart(ctx, config);
  }

  private updateChart() {
    if (this.chart) {
      this.chart.data = this.data();
      this.chart.update();
    }
  }
}
