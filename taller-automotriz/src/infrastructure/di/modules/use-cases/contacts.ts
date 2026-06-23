import { ListContactsUseCase } from '../../../../application/use-cases/contacts/list-contacts.use-case';
import { CreateContactUseCase } from '../../../../application/use-cases/contacts/create-contact.use-case';
import { UpdateContactUseCase } from '../../../../application/use-cases/contacts/update-contact.use-case';
import { DeleteContactUseCase } from '../../../../application/use-cases/contacts/delete-contact.use-case';
import type { Repos } from '../repositories';

export function buildContactUseCases(repos: Repos) {
  const { supplierRepo } = repos;
  return {
    listContacts: new ListContactsUseCase(supplierRepo),
    createContact: new CreateContactUseCase(supplierRepo),
    updateContact: new UpdateContactUseCase(supplierRepo),
    deleteContact: new DeleteContactUseCase(supplierRepo),
  };
}
