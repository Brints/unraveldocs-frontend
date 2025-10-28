import { Component, Input, OnInit, OnDestroy, ViewChild, ElementRef, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

export interface DonutChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string[];
    borderColor?: string[];
    borderWidth?: number;
  }[];
}

@Component({
  selector: 'app-donut-chart',
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
export class DonutChartComponent implements OnInit, OnDestroy {
  @ViewChild('chartCanvas', { static: true }) chartCanvas!: ElementRef<HTMLCanvasElement>;
  @Input() data = signal<DonutChartData>({ labels: [], datasets: [] });
  @Input() title = signal('');
  @Input() centerText = signal('');

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

    const config: ChartConfiguration<'doughnut'> = {
      type: 'doughnut',
      data: this.data(),
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
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
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true
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
