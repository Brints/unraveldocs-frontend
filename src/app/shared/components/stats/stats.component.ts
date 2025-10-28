import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="stats-section" [class.animate]="animateOnVisible">
      <div class="container">
        <h2>Our Impact in Numbers</h2>
        <div class="stats-grid">
          <div class="stat-item" (click)="onStatClick('users')">
            <div class="stat-number">10K+</div>
            <div class="stat-label">Active Users</div>
          </div>
          <div class="stat-item" (click)="onStatClick('documents')">
            <div class="stat-number">50K+</div>
            <div class="stat-label">Documents Created</div>
          </div>
          <div class="stat-item" (click)="onStatClick('teams')">
            <div class="stat-number">1K+</div>
            <div class="stat-label">Teams</div>
          </div>
          <div class="stat-item" (click)="onStatClick('satisfaction')">
            <div class="stat-number">98%</div>
            <div class="stat-label">Satisfaction Rate</div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .stats-section {
      padding: 4rem 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 2rem;
      margin-top: 2rem;
    }
    .stat-item {
      text-align: center;
      cursor: pointer;
      transition: transform 0.3s ease;
    }
    .stat-item:hover {
      transform: translateY(-5px);
    }
    .stat-number {
      font-size: 3rem;
      font-weight: bold;
      margin-bottom: 0.5rem;
    }
    .stat-label {
      font-size: 1.1rem;
      opacity: 0.9;
    }
    .animate .stat-item {
      animation: fadeInUp 0.6s ease forwards;
    }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class StatsComponent {
  @Input() animateOnVisible = false;
  @Output() statClicked = new EventEmitter<string>();

  onStatClick(stat: string): void {
    this.statClicked.emit(stat);
  }
}
