import { Component, Input, Output, EventEmitter } from '@angular/core';


@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [],
  templateUrl: 'stats.component.html',
  styleUrl: 'stats.component.css'
})
export class StatsComponent {
  @Input() animateOnVisible = false;
  @Output() statClicked = new EventEmitter<string>();

  onStatClick(stat: string): void {
    this.statClicked.emit(stat);
  }
}
