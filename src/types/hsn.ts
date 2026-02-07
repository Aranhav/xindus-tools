export interface HSNClassification {
  hsn_code: string;
  hts_code?: string;
  description: string;
  confidence: number;
  chapter?: string;
  section?: string;
}

export interface ProductClassification {
  classification: HSNClassification;
  alternatives?: HSNClassification[];
}

export interface ClassificationResult {
  products: ProductClassification[];
  source?: string;
  error?: string;
}

export interface DutyCalculation {
  hts_code: string;
  duty_rate?: string;
  duty_amount?: number;
  destination_country: string;
  tariff_description?: string;
  error?: string;
}
