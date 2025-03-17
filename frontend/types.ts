export interface Document {
  id: string;
  title: string;
  content: string;
  score: string;
  dataset: string;
}

export interface NearTextType {
  concepts: [string] | [];
  certainty?: number;
  moveAwayFrom?: object;
}

export interface AdditionalType {
  generate: GenerateType
}

export interface GenerateType {
  error: string;
  singleResult: string;
}