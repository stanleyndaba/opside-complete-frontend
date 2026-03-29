export interface AmazonMarketplaceOption {
  id: string;
  name: string;
  region: string;
}

export const AMAZON_MARKETPLACES: AmazonMarketplaceOption[] = [
  { id: 'ATVPDKIKX0DER', name: 'United States (US)', region: 'North America' },
  { id: 'A2EUQ1WTGCTBG2', name: 'Canada (CA)', region: 'North America' },
  { id: 'A1AM78C64UM0Y8', name: 'Mexico (MX)', region: 'North America' },
  { id: 'A1PA6795UKMFR9', name: 'Germany (DE)', region: 'Europe' },
  { id: 'A1F8U5RK5QF0S', name: 'United Kingdom (UK)', region: 'Europe' },
  { id: 'APJ6JRA9NG5V4', name: 'Italy (IT)', region: 'Europe' },
  { id: 'A13V1IB3VIYZZH', name: 'France (FR)', region: 'Europe' },
  { id: 'AE08WJ6YKNBMC', name: 'South Africa (ZA)', region: 'Europe' },
  { id: 'A1VC38T7YXB528', name: 'Japan (JP)', region: 'Far East' },
  { id: 'A19970868YG99F', name: 'Australia (AU)', region: 'Far East' },
];
