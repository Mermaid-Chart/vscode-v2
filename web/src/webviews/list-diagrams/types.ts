export interface Project {
  id: string;
  title: string;
  documents: Document[];
}

export interface Document {
  createdAt: string;
  updatedAt: string;
  documentType: string;
  projectID: string;
  title: string;
  externalID: any;
  access: string;
  metaData: Record<string, unknown>;
  major: number;
  minor: number;
  updatedBy?: string;
  summary: string;
  code: string;
  yDoc: string;
  svgCode: any;
  svgCodeDark: string;
  workflowStateID: any;
  documentID: string;
  notes: any;
  positions: Record<string, unknown>;
  diagramDocumentID: string;
}
