export interface Country {
  code: string;
  name: string;
  flag: string;
  phoneCode: string;
}

export const countries: Country[] = [
  { code: 'US', name: 'United States', flag: '🇺🇸', phoneCode: '+1' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', phoneCode: '+1' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', phoneCode: '+44' },
  { code: 'FR', name: 'France', flag: '🇫🇷', phoneCode: '+33' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', phoneCode: '+49' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', phoneCode: '+39' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', phoneCode: '+34' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱', phoneCode: '+31' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', phoneCode: '+61' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿', phoneCode: '+64' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', phoneCode: '+81' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷', phoneCode: '+82' },
  { code: 'CN', name: 'China', flag: '🇨🇳', phoneCode: '+86' },
  { code: 'IN', name: 'India', flag: '🇮🇳', phoneCode: '+91' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', phoneCode: '+65' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾', phoneCode: '+60' },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭', phoneCode: '+66' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩', phoneCode: '+62' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭', phoneCode: '+63' },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳', phoneCode: '+84' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', phoneCode: '+55' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽', phoneCode: '+52' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷', phoneCode: '+54' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱', phoneCode: '+56' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴', phoneCode: '+57' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', phoneCode: '+27' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', phoneCode: '+234' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬', phoneCode: '+20' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', phoneCode: '+971' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', phoneCode: '+966' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷', phoneCode: '+90' },
  { code: 'RU', name: 'Russia', flag: '🇷🇺', phoneCode: '+7' },
  { code: 'UA', name: 'Ukraine', flag: '🇺🇦', phoneCode: '+380' },
  { code: 'PL', name: 'Poland', flag: '🇵🇱', phoneCode: '+48' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪', phoneCode: '+46' },
  { code: 'NO', name: 'Norway', flag: '🇳🇴', phoneCode: '+47' },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰', phoneCode: '+45' },
  { code: 'FI', name: 'Finland', flag: '🇫🇮', phoneCode: '+358' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭', phoneCode: '+41' },
  { code: 'AT', name: 'Austria', flag: '🇦🇹', phoneCode: '+43' },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪', phoneCode: '+32' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹', phoneCode: '+351' },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪', phoneCode: '+353' },
  { code: 'GR', name: 'Greece', flag: '🇬🇷', phoneCode: '+30' },
  { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿', phoneCode: '+420' },
  { code: 'HU', name: 'Hungary', flag: '🇭🇺', phoneCode: '+36' },
  { code: 'RO', name: 'Romania', flag: '🇷🇴', phoneCode: '+40' },
  { code: 'BG', name: 'Bulgaria', flag: '🇧🇬', phoneCode: '+359' },
  { code: 'HR', name: 'Croatia', flag: '🇭🇷', phoneCode: '+385' },
  { code: 'SI', name: 'Slovenia', flag: '🇸🇮', phoneCode: '+386' },
  { code: 'SK', name: 'Slovakia', flag: '🇸🇰', phoneCode: '+421' },
  { code: 'LT', name: 'Lithuania', flag: '🇱🇹', phoneCode: '+370' },
  { code: 'LV', name: 'Latvia', flag: '🇱🇻', phoneCode: '+371' },
  { code: 'EE', name: 'Estonia', flag: '🇪🇪', phoneCode: '+372' },
];

export const getCountryByCode = (code: string): Country | undefined => {
  return countries.find(country => country.code === code);
};

export const getCountryByPhoneCode = (phoneCode: string): Country | undefined => {
  return countries.find(country => country.phoneCode === phoneCode);
};

export const getCountryOptions = () => {
  return countries.map(country => ({
    value: country.code,
    label: country.name,
    flag: country.flag,
  }));
};

export const getPhoneCodeOptions = () => {
  return countries.map(country => ({
    value: country.phoneCode,
    label: `${country.flag} ${country.phoneCode}`,
    key: `${country.code}-${country.phoneCode}`, // Unique key combining country code and phone code
  }));
};