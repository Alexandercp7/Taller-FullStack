import { RegisterIntakeCausesUseCase } from '../../../../application/use-cases/reception/register-intake-causes.use-case';
import { UploadPhotosUseCase } from '../../../../application/use-cases/reception/upload-intake-photos.use-case';
import type { Repos } from '../repositories';
import type { Infra } from '../infra';

export function buildReceptionUseCases(repos: Repos, infra: Infra) {
  const { orderRepo, timelineRepo, photoRepo } = repos;
  const { fileStorage } = infra;
  return {
    registerIntakeCauses: new RegisterIntakeCausesUseCase(orderRepo, timelineRepo),
    uploadPhotos: new UploadPhotosUseCase(photoRepo, fileStorage),
  };
}
