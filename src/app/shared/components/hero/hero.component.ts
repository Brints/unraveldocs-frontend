import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule],
  templateUrl: 'hero.component.html',
  styleUrls: ['hero.component.css'],
})
export class HeroComponent {
  currentStep = 1;

  constructor() {
    this.startAnimation();
  }

  onGetStarted() {
    console.log('Get Started clicked');
  }

  onWatchDemo() {
    console.log('Watch Demo clicked');
  }

  private startAnimation() {
    const cycle = () => {
      this.currentStep = 1;
      setTimeout(() => (this.currentStep = 2), 2000);
      setTimeout(() => (this.currentStep = 3), 4000);
    };

    cycle();
    setInterval(cycle, 6000);
  }
}
