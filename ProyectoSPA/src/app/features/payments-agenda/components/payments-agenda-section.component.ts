import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideTrash2, lucideCamera, lucidePlus, lucideX, lucidePencil, lucideCheck, lucideCalendarPlus, lucideCalendarCheck } from '@ng-icons/lucide';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { HlmDialogService } from '@spartan-ng/helm/dialog';
import { HlmCalendarImports } from '../../../components/ui/calendar/src';
import { NotificationService, GoogleCalendarService } from '../../../core';
import { DatePickerFieldComponent } from '../../../shared';
import { PaymentsAgendaService } from '../services/payments-agenda.service';
import { Payment } from '../models/payment.model';
import { CreatePaymentDialogComponent, type CreatePaymentDialogContext } from './create-payment-dialog/create-payment-dialog';
import { PhotoUploadDialogComponent, type PhotoUploadDialogContext } from './photo-upload-dialog/photo-upload-dialog';

@Component({
  selector: 'spartan-payments-agenda-section',
  standalone: true,
  imports: [
    CommonModule,
    HlmCardImports,
    HlmTableImports,
    HlmInputImports,
    HlmBadgeImports,
    HlmButtonImports,
    HlmCalendarImports,
    NgIcon,
    DatePickerFieldComponent,
  ],
  providers: [provideIcons({ lucideTrash2, lucideCamera, lucidePlus, lucideX, lucidePencil, lucideCheck, lucideCalendarPlus, lucideCalendarCheck })],
  templateUrl: './payments-agenda-section.html',
  styleUrl: './payments-agenda-section.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentsAgendaSectionComponent implements OnInit {
  private readonly service = inject(PaymentsAgendaService);
  private readonly notification = inject(NotificationService);
  private readonly dialog = inject(HlmDialogService);
  protected readonly googleCalendar = inject(GoogleCalendarService);
  public readonly payments = computed(() => this.service.getPayments());

  protected readonly isExportingAll = signal(false);
  protected readonly exportingPaymentId = signal<string | null>(null);

  protected readonly search = signal('');
  protected readonly filterDateStart = signal('');
  protected readonly filterDateEnd = signal('');
  protected readonly viewMode = signal<'table' | 'calendar'>('table');
  protected readonly selectedCalendarDate = signal<Date>(new Date());

  protected readonly filteredPayments = computed(() => {
    const term = this.search().trim().toLowerCase();
    const dateStart = this.filterDateStart().trim();
    const dateEnd = this.filterDateEnd().trim();
    const mode = this.viewMode();

    return this.payments().filter((payment) => {
      const matchesSearch =
        !term ||
        payment.concepto.toLowerCase().includes(term) ||
        payment.categoria.toLowerCase().includes(term);

      const paymentDate = payment.fechaVencimiento;
      const matchesDateRange =
        (!dateStart || paymentDate >= dateStart) &&
        (!dateEnd || paymentDate <= dateEnd);

      if (mode === 'calendar') {
        const selectedDate = this.selectedCalendarDate();
        const selectedDateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
        return matchesSearch && paymentDate === selectedDateStr;
      }

      return matchesSearch && matchesDateRange;
    });
  });

  protected updateSearch(value: string): void {
    this.search.set(value);
  }

  protected updateDateStart(value: string): void {
    this.filterDateStart.set(value);
  }

  protected updateDateEnd(value: string): void {
    this.filterDateEnd.set(value);
  }

  protected onCalendarDateChange(date: unknown): void {
    if (date instanceof Date) {
      this.selectedCalendarDate.set(date);
    }
  }

  getStatusClass(estado: Payment['estado']) {
    switch (estado) {
      case 'Pendiente': return 'stock-low';
      case 'Pagado': return 'stock-ok';
      case 'Vencido': return 'bg-destructive-border border-destructive text-destructive-foreground';
      default: return '';
    }
  }

  ngOnInit(): void {
    this.checkUpcomingAlerts();
  }

  checkUpcomingAlerts() {
    const now = new Date();
    for (const payment of this.payments()) {
      if (payment.estado !== 'Pendiente') continue;
      const due = new Date(payment.fechaVencimiento);
      const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 3) {
        this.notification.warning(`El pago de "${payment.concepto}" vence en 3 días.`);
      } else if (diffDays === 1) {
        this.notification.error(`El pago de "${payment.concepto}" vence mañana.`);
      }
    }
  }

  onComprobanteSelected(payment: Payment): void {
    const context: PhotoUploadDialogContext = {
      currentPhoto: payment.comprobanteUrl,
      onSave: (photoUrl: string) => {
        this.service.updatePayment(payment.id, { comprobanteUrl: photoUrl });
        this.notification.success('Comprobante adjuntado.');
      },
      onDelete: () => {
        this.service.updatePayment(payment.id, { comprobanteUrl: undefined });
        this.notification.success('Comprobante eliminado.');
      },
    };

    this.dialog.open(PhotoUploadDialogComponent, {
      context,
      contentClass: 'payment-photo-dialog-content',
    });
  }

  protected createPayment(): void {
    const context: CreatePaymentDialogContext = {
      onCreate: (payload) => {
        const payment = this.service.generatePaymentWithId(payload);
        this.service.addPayment(payment);
        this.notification.success('Pago creado correctamente.');
      },
    };

    this.dialog.open(CreatePaymentDialogComponent, {
      context,
      contentClass: 'payment-create-dialog-content',
    });
  }

  protected editPayment(payment: Payment): void {
    const context: CreatePaymentDialogContext = {
      payment,
      onUpdate: (id: string, payload) => {
        this.service.updatePayment(id, payload);
        this.notification.success('Pago actualizado correctamente.');
      },
    };

    this.dialog.open(CreatePaymentDialogComponent, {
      context,
      contentClass: 'payment-create-dialog-content',
    });
  }

  protected deletePayment(paymentId: string): void {
    this.service.deletePayment(paymentId);
    this.notification.success('Pago eliminado.');
  }

  protected confirmPayment(payment: Payment): void {
    if (payment.estado === 'Pagado') {
      this.notification.info('Este pago ya está confirmado.');
      return;
    }
    this.service.updatePayment(payment.id, { estado: 'Pagado' });
    this.notification.success('Pago confirmado correctamente.');
  }

  protected async exportAllToGoogleCalendar(): Promise<void> {
    this.isExportingAll.set(true);
    try {
      const { success, failed } = await this.googleCalendar.exportAllPendingPayments(this.payments());
      if (success > 0) {
        this.notification.success(`${success} pago(s) exportado(s) a Google Calendar.`);
      }
      if (failed > 0) {
        this.notification.error(`${failed} pago(s) no pudieron exportarse.`);
      }
    } catch (err: any) {
      this.notification.error(err?.message ?? 'Error al conectar con Google Calendar.');
    } finally {
      this.isExportingAll.set(false);
    }
  }

  protected async exportPaymentToGoogleCalendar(payment: Payment): Promise<void> {
    this.exportingPaymentId.set(payment.id);
    try {
      await this.googleCalendar.exportPayment(payment);
      this.notification.success(`"${payment.concepto}" exportado a Google Calendar.`);
    } catch (err: any) {
      this.notification.error(err?.message ?? 'Error al exportar a Google Calendar.');
    } finally {
      this.exportingPaymentId.set(null);
    }
  }
}

