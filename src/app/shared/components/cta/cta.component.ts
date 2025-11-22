import { Component, Input, Output, EventEmitter } from '@angular/core';


@Component({
  selector: 'app-cta',
  standalone: true,
  imports: [],
  templateUrl: 'cta.component.html',
  styleUrl: 'cta.component.css'
})
export class CtaComponent {
  @Input() variant = 'default';
  @Output() ctaClicked = new EventEmitter<string>();
  @Output() signupCompleted = new EventEmitter<void>();

  onCtaClick(): void {
    this.ctaClicked.emit('cta-primary');
  }

  onSignupClick(): void {
    this.signupCompleted.emit();
  }
}
