export interface HSNClassification {
  hsn_code: string;
  hts_code?: string;
  description: string;
  confidence: number;
  chapter?: string;
  section?: string;
}

export interface ClassificationResult {
  classification: HSNClassification;
  alternatives?: HSNClassification[];
  product_description?: string;
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
