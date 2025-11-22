import { Component, Output, EventEmitter } from '@angular/core';


@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [],
  templateUrl: './hero.component.html',
  styleUrls: ['./hero.component.css']
})
export class HeroComponent {
  @Output() ctaClicked = new EventEmitter<string>();
  @Output() signupCompleted = new EventEmitter<void>();

  currentStep = 1;

  constructor() {
    this.startAnimation();
  }

  startAnimation() {
    setInterval(() => {
      this.currentStep = this.currentStep === 3 ? 1 : this.currentStep + 1;
    }, 2000);
  }

  onGetStarted() {
    // Emit event or navigate to signup
    console.log('Get Started clicked');
    this.ctaClicked.emit('hero-get-started');
  }

  onWatchDemo() {
    // Open demo modal or navigate to demo
    console.log('Watch Demo clicked');
    this.ctaClicked.emit('hero-watch-demo');
  }

  onSignupComplete() {
    this.signupCompleted.emit();
  }
}
