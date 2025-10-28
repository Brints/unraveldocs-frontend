import { Component, Input, OnInit, ViewChild, ElementRef, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import {AreaChartData} from './data';

Chart.register(...registerables);

@Component({
  selector: 'app-area-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: 'area-chart.component.html',
  styleUrls: ['area-chart.component.css'],
})
export class AreaChartComponent implements OnInit {
  @ViewChild('chartCanvas', { static: true }) chartCanvas!: ElementRef<HTMLCanvasElement>;
  @Input() data = signal<AreaChartData>({ labels: [], datasets: [] });
  @Input() title = signal('');
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
      type: 'line' as ChartType,
      data: this.data(),
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
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
          },
          filler: {
            propagate: false
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
        },
        elements: {
          line: {
            tension: 0.4
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
