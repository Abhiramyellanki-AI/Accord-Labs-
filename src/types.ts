export type DocumentStatus = 'uploaded' | 'processing' | 'completed' | 'error';
export type FileType = 'pdf' | 'xlsx';
export type Category = 'hardware' | 'software';

export interface UserProfile {
  uid: string;
  email: string;
  createdAt: string;
}

export interface TenderDocument {
  id: string;
  userId: string;
  fileName: string;
  fileType: FileType;
  uploadDate: string;
  status: DocumentStatus;
}

export interface ExtractedData {
  id: string;
  documentId: string;
  category: Category;
  parameter: string;
  value: string;
  normalized_unit?: string;
  notes?: string;
  confidenceScore?: number;
}
