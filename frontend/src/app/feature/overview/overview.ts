import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../shared/headers/header';
import { Title } from '@angular/platform-browser';

interface ScoreHistoryRow {
  readonly id: string;
  readonly unitName: string;
  readonly score: number;
  readonly createdAt: string;
}

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './overview.html',
})
export class Overview {
  private readonly titleService = inject(Title);

  ngOnInit(): void {
    this.titleService.setTitle('SIGADBV - Visão Geral');
  }

  readonly totalScore = 850;
  readonly activeUnits = 5;

  readonly scoreHistory: readonly ScoreHistoryRow[] = [
    {
      id: 'history-001',
      unitName: 'Gavião-Real',
      score: 100,
      createdAt: '2026-09-23T20:00:00.000Z',
    },
    {
      id: 'history-002',
      unitName: 'Águia Dourada',
      score: 250,
      createdAt: '2026-09-21T14:30:00.000Z',
    },
    {
      id: 'history-003',
      unitName: 'Falcão Peregrino',
      score: 500,
      createdAt: '2026-09-18T09:15:00.000Z',
    },
  ];

  trackById(_index: number, record: ScoreHistoryRow): string {
    return record.id;
  }
}
