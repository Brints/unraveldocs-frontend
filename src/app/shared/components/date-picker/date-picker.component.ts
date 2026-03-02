import { Component, Input, Output, EventEmitter, signal, computed, HostListener, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-date-picker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './date-picker.component.html',
  styleUrls: ['./date-picker.component.css']
})
export class DatePickerComponent {
  private _value = signal<string>('');

  @Input()
  set value(val: string) {
    this._value.set(val || '');
  }
  get value(): string {
    return this._value();
  }
  @Input() placeholder: string = 'Select date';
  @Input() disabled: boolean = false;
  @Input() title: string = '';
  @Output() valueChange = new EventEmitter<string>();

  private elementRef = inject(ElementRef);

  isOpen = signal(false);
  viewMode = signal<'days' | 'months' | 'years'>('days');
  currentMonth = signal(new Date().getMonth());
  currentYear = signal(new Date().getFullYear());
  yearPage = signal(new Date().getFullYear());

  private readonly daysInWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  readonly monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  readonly shortMonthNames = this.monthNames.map(m => m.substring(0, 3));

  readonly calendarDays = computed(() => {
    const year = this.currentYear();
    const month = this.currentMonth();
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    const days: { date: number; month: 'prev' | 'current' | 'next'; fullDate: string; isToday: boolean; isSelected: boolean }[] = [];
    
    // Previous month's padding
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const m = month === 0 ? 11 : month - 1;
      const y = month === 0 ? year - 1 : year;
      days.push({
        date: d,
        month: 'prev',
        fullDate: this.formatDate(y, m, d),
        isToday: false,
        isSelected: false
      });
    }
    
    // Current month
    const today = new Date();
    const todayString = this.formatDate(today.getFullYear(), today.getMonth(), today.getDate());
    const val = this._value();
    
    for (let i = 1; i <= daysInMonth; i++) {
      const fullDate = this.formatDate(year, month, i);
      days.push({
        date: i,
        month: 'current',
        fullDate,
        isToday: fullDate === todayString,
        isSelected: fullDate === val
      });
    }
    
    // Next month's padding
    const remainingDays = 42 - days.length; // Always show 6 weeks (42 days)
    for (let i = 1; i <= remainingDays; i++) {
      const m = month === 11 ? 0 : month + 1;
      const y = month === 11 ? year + 1 : year;
      days.push({
        date: i,
        month: 'next',
        fullDate: this.formatDate(y, m, i),
        isToday: false,
        isSelected: false
      });
    }
    
    return {
      headers: this.daysInWeek,
      grid: days
    };
  });

  readonly displayMonthYear = computed(() => {
    return `${this.monthNames[this.currentMonth()]} ${this.currentYear()}`;
  });

  readonly yearRange = computed(() => {
    const baseYear = this.yearPage();
    // Show 12 years at a time (3x4 grid)
    const startYear = Math.floor(baseYear / 12) * 12;
    return Array.from({ length: 12 }, (_, i) => startYear + i);
  });

  readonly formattedValue = computed(() => {
    const val = this._value();
    if (!val) return '';
    const parts = val.split('-');
    if (parts.length !== 3) return val;
    const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  });

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }

  toggleCalendar() {
    if (this.disabled) return;
    this.isOpen.update(v => !v);
    
    // If opening, jump to the currently selected date's month (or today)
    if (this.isOpen()) {
      let targetDate = new Date();
      if (this.value) {
        const parts = this.value.split('-');
        if (parts.length === 3) {
          targetDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        }
      }
      this.currentMonth.set(targetDate.getMonth());
      this.currentYear.set(targetDate.getFullYear());
      this.yearPage.set(targetDate.getFullYear());
      this.viewMode.set('days');
    }
  }

  prev(event: Event) {
    event.stopPropagation();
    switch (this.viewMode()) {
      case 'days':
        if (this.currentMonth() === 0) {
          this.currentMonth.set(11);
          this.currentYear.update(y => y - 1);
        } else {
          this.currentMonth.update(m => m - 1);
        }
        break;
      case 'months':
        this.currentYear.update(y => y - 1);
        break;
      case 'years':
        this.yearPage.update(y => y - 12);
        break;
    }
  }

  next(event: Event) {
    event.stopPropagation();
    switch (this.viewMode()) {
      case 'days':
        if (this.currentMonth() === 11) {
          this.currentMonth.set(0);
          this.currentYear.update(y => y + 1);
        } else {
          this.currentMonth.update(m => m + 1);
        }
        break;
      case 'months':
        this.currentYear.update(y => y + 1);
        break;
      case 'years':
        this.yearPage.update(y => y + 12);
        break;
    }
  }

  setMonth(index: number, event: Event) {
    event.stopPropagation();
    this.currentMonth.set(index);
    this.viewMode.set('days');
  }

  setYear(year: number, event: Event) {
    event.stopPropagation();
    this.currentYear.set(year);
    this.yearPage.set(year);
    this.viewMode.set('months');
  }

  selectDate(day: any, event: Event) {
    event.stopPropagation();
    this.value = day.fullDate;
    this.valueChange.emit(this.value);
    this.isOpen.set(false);
  }

  clearSelection(event: Event) {
    event.stopPropagation();
    this.value = '';
    this.valueChange.emit(this.value);
    this.isOpen.set(false);
  }

  jumpToToday(event: Event) {
    event.stopPropagation();
    const today = new Date();
    const todayStr = this.formatDate(today.getFullYear(), today.getMonth(), today.getDate());
    this.value = todayStr;
    this.valueChange.emit(this.value);
    this.isOpen.set(false);
  }

  private formatDate(year: number, month: number, day: number): string {
    const m = (month + 1).toString().padStart(2, '0');
    const d = day.toString().padStart(2, '0');
    return `${year}-${m}-${d}`;
  }
}
