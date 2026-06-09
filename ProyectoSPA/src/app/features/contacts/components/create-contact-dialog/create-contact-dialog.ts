import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrnDialogRef, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import { Contact } from '../../models/contact.model';
import { ContactsService } from '../../services/contacts.service';

export interface CreateContactDialogContext {
  contact?: Contact;
  availableTags?: string[];
  onCreate?: (contact: Omit<Contact, 'id'>) => void;
  onUpdate?: (id: string, contact: Partial<Contact>) => void;
}

@Component({
  selector: 'spartan-create-contact-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, HlmButtonImports, HlmInputImports, HlmSelectImports, HlmLabelImports],
  templateUrl: './create-contact-dialog.html',
  styleUrl: './create-contact-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateContactDialogComponent {
  private readonly dialogRef = inject(BrnDialogRef<unknown>);
  private readonly contactsService = inject(ContactsService);
  protected readonly context = injectBrnDialogContext<CreateContactDialogContext>();
  protected readonly isEditMode = !!this.context.contact;
  protected readonly availableTags = this.context.availableTags || [];

  protected nombre = this.context.contact?.nombre || '';
  protected rfc = this.context.contact?.rfc || '';
  protected telefono = this.context.contact?.telefono || '';
  protected correo = this.context.contact?.correo || '';
  protected empresa = this.context.contact?.empresa || '';
  protected diasPago = this.context.contact?.condicionesDeCreditoL.diasPago || 30;
  protected limiteCredito = this.context.contact?.condicionesDeCreditoL.limiteCredito || 0;
  protected politicaDescuentos = this.context.contact?.condicionesDeCreditoL.politicaDescuentos || '';
  protected etiqueta = signal(this.context.contact?.etiquetas[0] || '');

  protected onEtiquetaChange(value: string): void {
    if (value.trim().length > 0) {
      this.etiqueta.set(value);
      if (!this.availableTags.includes(value) && value.trim().length > 0) {
        this.availableTags.push(value);
        this.contactsService.addTag(value);
      }
    }
  }

  protected save(): void {
    const currentTag = this.etiqueta();
    const tagsArray = currentTag.trim().length > 0 ? [currentTag] : [];

    const contactData = {
      nombre: this.nombre,
      rfc: this.rfc,
      telefono: this.telefono,
      correo: this.correo,
      empresa: this.empresa,
      condicionesDeCreditoL: {
        diasPago: Number(this.diasPago),
        limiteCredito: Number(this.limiteCredito),
        politicaDescuentos: this.politicaDescuentos,
      },
      productosQueSurten: this.context.contact?.productosQueSurten || [],
      etiquetas: tagsArray,
    };

    if (this.isEditMode && this.context.contact) {
      this.context.onUpdate?.(this.context.contact.id, contactData);
    } else {
      this.context.onCreate?.(contactData);
    }

    this.dialogRef.close(true);
  }

  protected close(): void {
    this.dialogRef.close(false);
  }
}
