import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ModalComponent, ModalSize } from './modal.component';

@Component({
  standalone: true,
  imports: [ModalComponent],
  template: `
    <app-modal
      [isOpen]="isOpen"
      [title]="title"
      [size]="size"
      (close)="onClose()"
    >
      <p class="projected-body">Conteúdo do modal</p>
      <button modal-footer type="button">Ação</button>
    </app-modal>
  `,
})
class ModalHostComponent {
  isOpen = true;
  title = 'Modal de teste';
  size: ModalSize = 'md';
  onClose = vi.fn();
}

describe('ModalComponent', () => {
  let fixture: ComponentFixture<ModalComponent>;
  let component: ModalComponent;
  let onClose: ReturnType<typeof vi.fn>;
  let closeCount: number;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalComponent, ModalHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ModalComponent);
    component = fixture.componentInstance;
    onClose = vi.fn();

    closeCount = 0;

    fixture.componentRef.setInput('isOpen', false);
    component.close.subscribe(() => {
      closeCount++;
    });
    fixture.detectChanges();
  });

  it('should not render the dialog when closed', () => {
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
  });

  it('should render the dialog with the default title when open', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Confirmação');
    expect(
      fixture.nativeElement
        .querySelector('[role="dialog"]')
        .getAttribute('aria-modal'),
    ).toBe('true');
  });

  it('should render a custom title', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('title', 'Confirme a ação');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Confirme a ação');
  });

  it.each([
    ['sm', 'max-w-sm'],
    ['md', 'max-w-lg'],
    ['lg', 'max-w-2xl'],
    ['xl', 'max-w-4xl'],
  ] as const)('should apply the %s size class', (size, expectedClass) => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('size', size);
    fixture.detectChanges();

    const dialog = fixture.nativeElement.querySelector('[role="dialog"]');
    expect(dialog.classList).toContain(expectedClass);
  });

  it('should emit close when the close button is clicked', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    const closeButton: HTMLButtonElement = fixture.nativeElement.querySelector(
      'button[aria-label="Fechar modal"]',
    );
    closeButton.click();

    expect(closeCount).toBe(1);
  });

  it('should emit close when the backdrop itself is clicked', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    const backdrop: HTMLDivElement =
      fixture.nativeElement.querySelector('.fixed.inset-0');
    backdrop.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(closeCount).toBe(1);
  });

  it('should not emit close when content inside the dialog is clicked', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    const dialog: HTMLDivElement =
      fixture.nativeElement.querySelector('[role="dialog"]');
    dialog.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(closeCount).toBe(0);
  });

  it('should project body content and modal footer content', () => {
    const hostFixture = TestBed.createComponent(ModalHostComponent);
    hostFixture.detectChanges();

    const modalElement = hostFixture.nativeElement;
    expect(
      modalElement.querySelector('.projected-body')?.textContent,
    ).toContain('Conteúdo do modal');
    expect(modalElement.querySelector('[modal-footer]')?.textContent).toContain(
      'Ação',
    );

    hostFixture.destroy();
  });

  it('should emit close through the host component when the backdrop is clicked', () => {
    const hostFixture = TestBed.createComponent(ModalHostComponent);
    hostFixture.detectChanges();

    const backdrop: HTMLDivElement =
      hostFixture.nativeElement.querySelector('.fixed.inset-0');
    backdrop.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(hostFixture.componentInstance.onClose).toHaveBeenCalledOnce();

    hostFixture.destroy();
  });
});
