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
  enhanced_match?: string;
}

export interface AddressValidationResult {
  input_address: AddressInput;
  normalized_address?: AddressInput;
  validated_address?: AddressInput;
  delivery_line?: string;
  last_line?: string;
  is_valid: boolean;
  dpv_analysis?: DPVAnalysis;
  metadata?: {
    record_type?: string;
    zip_type?: string;
    county_name?: string;
    county_fips?: string;
    carrier_route?: string;
    congressional_district?: string;
    building_default_indicator?: string;
    rdi?: string;
    latitude?: number;
    longitude?: number;
    precision?: string;
    time_zone?: string;
    utc_offset?: number;
    dst?: boolean;
  };
  timings?: {
    claude_ms?: number;
    smarty_ms?: number;
    total_ms?: number;
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
