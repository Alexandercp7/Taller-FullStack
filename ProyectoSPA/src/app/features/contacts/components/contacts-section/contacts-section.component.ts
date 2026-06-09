import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideEye, lucidePencil, lucideTrash2 } from '@ng-icons/lucide';
import { HlmDialogService } from '@spartan-ng/helm/dialog';
import { NotificationService } from '../../../../core';
import { ContactsService } from '../../services/contacts.service';
import { Contact } from '../../models/contact.model';
import { ContactDetailDialogComponent, type ContactDetailDialogContext } from '../contact-detail-dialog/contact-detail-dialog';
import { CreateContactDialogComponent, type CreateContactDialogContext } from '../create-contact-dialog/create-contact-dialog';

@Component({
  selector: 'spartan-contacts-section',
  standalone: true,
  imports: [
    CommonModule,
    HlmCardImports,
    HlmBadgeImports,
    HlmButtonImports,
    HlmInputImports,
    HlmSelectImports,
    HlmTableImports,
    NgIcon,
  ],
  providers: [provideIcons({ lucideEye, lucidePencil, lucideTrash2 })],
  templateUrl: './contacts-section.html',
  styleUrl: './contacts-section.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactsSectionComponent {
  private readonly service = inject(ContactsService);
  private readonly notification = inject(NotificationService);
  private readonly dialog = inject(HlmDialogService);

  public readonly contacts = computed(() => this.service.getContacts());

  protected readonly viewMode = signal<'list' | 'grid'>('list');
  protected readonly searchText = signal('');
  protected readonly selectedTags = signal<string[]>([]);

  protected readonly filteredContacts = computed(() => {
    const search = this.searchText().trim().toLowerCase();
    const tags = this.selectedTags();

    return this.contacts().filter(contact => {
      const matchesSearch =
        !search ||
        contact.nombre.toLowerCase().includes(search) ||
        contact.rfc.toLowerCase().includes(search) ||
        contact.telefono.toLowerCase().includes(search) ||
        contact.correo.toLowerCase().includes(search);

      const matchesTags = tags.length === 0 || tags.some(tag => contact.etiquetas.includes(tag));

      return matchesSearch && matchesTags;
    });
  });

  protected readonly availableTags = computed(() => this.service.getAllTags());

  protected readonly selectedTagsLabel = computed(() => {
    const tags = this.selectedTags();
    if (tags.length === 0) return 'Todas las etiquetas';
    if (tags.length === 1) return tags[0];
    return `${tags[0]} (+${tags.length - 1} más)`;
  });

  protected setView(mode: 'list' | 'grid'): void {
    this.viewMode.set(mode);
  }

  protected updateSearch(value: string): void {
    this.searchText.set(value);
  }

  protected toggleTag(tag: string): void {
    this.selectedTags.update(tags =>
      tags.includes(tag) ? tags.filter(t => t !== tag) : [...tags, tag]
    );
  }

  protected addNewTag(newTag: string): void {
    if (!newTag.trim() || this.availableTags().includes(newTag)) return;
    const tags = this.availableTags();
    tags.push(newTag);
    this.notification.success(`Etiqueta '${newTag}' creada.`);
  }

  protected createContact(): void {
    const context: CreateContactDialogContext = {
      availableTags: this.availableTags(),
      onCreate: (payload) => {
        const contact = this.service.generateContactWithId(payload);
        this.service.addContact(contact);
        this.notification.success('Contacto creado correctamente.');
      },
    };

    this.dialog.open(CreateContactDialogComponent, {
      context,
      contentClass: 'contact-create-dialog-content',
    });
  }

  protected editContact(contact: Contact): void {
    const context: CreateContactDialogContext = {
      contact,
      availableTags: this.availableTags(),
      onUpdate: (id: string, payload) => {
        this.service.updateContact(id, payload);
        this.notification.success('Contacto actualizado correctamente.');
      },
    };

    this.dialog.open(CreateContactDialogComponent, {
      context,
      contentClass: 'contact-create-dialog-content',
    });
  }

  protected viewDetails(contact: Contact): void {
    const context: ContactDetailDialogContext = {
      contact,
    };

    this.dialog.open(ContactDetailDialogComponent, {
      context,
      contentClass: 'contact-detail-dialog-content',
    });
  }

  protected deleteContact(id: string): void {
    this.service.deleteContact(id);
    this.notification.success('Contacto eliminado.');
  }

  protected updateContactTag(contactId: string, newTag: string): void {
    const contact = this.service.getContactById(contactId);
    if (contact) {
      const newTags = [...new Set([...contact.etiquetas, newTag])];
      this.service.updateContact(contactId, { etiquetas: newTags });
      this.notification.success('Etiqueta actualizada.');
    }
  }
}
