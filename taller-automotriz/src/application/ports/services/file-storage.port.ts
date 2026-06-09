export interface FileStorage {
  getUploadUrl(key: string, contentType: string): Promise<string>;
  getDownloadUrl(key: string): Promise<string>;
  delete(key: string): Promise<void>;
}
