export interface AutocompleteSuggestion {
  street_line: string;
  secondary: string;
  city: string;
  state: string;
  zipcode: string;
  entries: number;
}

export interface AddressInput {
  street: string;
  secondary?: string;
  city: string;
  state: string;
  zipcode: string;
  country?: string;
}

export interface DPVAnalysis {
  dpv_match_code: string;
  dpv_footnotes: string;
  dpv_cmra: string;
  dpv_vacant: string;
  dpv_no_stat: string;
  active: string;
}

export interface AddressValidationResult {
  input_address: AddressInput;
  normalized_address?: AddressInput;
  is_valid: boolean;
  dpv_analysis?: DPVAnalysis;
  metadata?: {
    county_name?: string;
    carrier_route?: string;
    building_default_indicator?: string;
    rdi?: string;
    latitude?: number;
    longitude?: number;
  };
  analysis?: {
    dpv_match_code?: string;
    footnotes?: string;
    active?: string;
  };
  footnotes?: string[];
  error?: string;
}

export interface NormalizeResult {
  original: AddressInput;
  normalized: AddressInput;
  ai_analysis?: string;
  confidence?: number;
}

export interface BulkValidationResult {
  results: AddressValidationResult[];
  summary: {
    total: number;
    valid: number;
    invalid: number;
  };
}
