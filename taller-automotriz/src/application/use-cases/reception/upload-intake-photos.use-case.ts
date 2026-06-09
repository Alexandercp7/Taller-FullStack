import { PhotoRepository } from '../../ports/repositories/photo.repository';
import { FileStorage } from '../../ports/services/file-storage.port';
import { PhotoPhase } from '../../../domain/enums/photo-phase.enum';
import { createId } from '../../../shared/identifier';

interface UploadPhotoInput {
  orderId: string;
  phase: PhotoPhase;
  fileName: string;
  contentType: string;
  caption?: string;
  uploadedBy: string;
}

interface UploadPhotoOutput {
  photoId: string;
  uploadUrl: string;
  photoUrl: string;
}

export class UploadPhotosUseCase {
  constructor(
    private readonly photoRepo: PhotoRepository,
    private readonly fileStorage: FileStorage,
  ) {}

  async execute(input: UploadPhotoInput): Promise<UploadPhotoOutput> {
    const key = `photos/${input.orderId}/${input.phase}/${createId()}-${input.fileName}`;

    const uploadUrl = await this.fileStorage.getUploadUrl(key, input.contentType);
    const photoUrl = await this.fileStorage.getDownloadUrl(key);

    const photo = await this.photoRepo.save({
      orderId: input.orderId,
      phase: input.phase,
      url: photoUrl,
      key,
      caption: input.caption ?? null,
      uploadedBy: input.uploadedBy,
    });

    return { photoId: photo.id, uploadUrl, photoUrl };
  }
}
