import { NgIf, NgStyle } from '@angular/common';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NgStyle, NgIf],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  protected percent = 0;
  protected blur = 30;

  get loadingOpacity() {
    return this.map(this.percent, 0, 100, 1, 0);
  }

  ngOnInit(): void {
    const interval = setInterval(() => {
      if (this.percent < 100) {
        this.percent++;
        this.blur = this.map(this.percent, 0, 100, 30, 0);
      } else {
        clearInterval(interval);
      }
    }, 30);
  }

  map(
    num: number,
    in_min: number,
    in_max: number,
    out_min: number,
    out_max: number
  ) {
    return ((num - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min;
  }
}
