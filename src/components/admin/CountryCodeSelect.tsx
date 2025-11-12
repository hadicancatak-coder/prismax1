import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface CountryCode {
  code: string;
  name: string;
  flag: string;
}

const COUNTRY_CODES: CountryCode[] = [
  { code: 'ae', name: 'UAE', flag: '🇦🇪' },
  { code: 'sa', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'eg', name: 'Egypt', flag: '🇪🇬' },
  { code: 'kw', name: 'Kuwait', flag: '🇰🇼' },
  { code: 'bh', name: 'Bahrain', flag: '🇧🇭' },
  { code: 'om', name: 'Oman', flag: '🇴🇲' },
  { code: 'qa', name: 'Qatar', flag: '🇶🇦' },
  { code: 'custom', name: 'Custom', flag: '🌐' },
];

interface CountryCodeSelectProps {
  value: string;
  onChange: (value: string) => void;
  customValue?: string;
  onCustomChange?: (value: string) => void;
}

export function CountryCodeSelect({ value, onChange, customValue = '', onCustomChange }: CountryCodeSelectProps) {
  const isCustom = value === 'custom';

  return (
    <div className="space-y-2">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select country code">
            {value && !isCustom && (
              <span>
                {COUNTRY_CODES.find(c => c.code === value)?.flag} {value.toUpperCase()}
              </span>
            )}
            {isCustom && <span>🌐 Custom</span>}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {COUNTRY_CODES.map(country => (
            <SelectItem key={country.code} value={country.code}>
              <span className="flex items-center gap-2">
                <span>{country.flag}</span>
                <span>{country.name}</span>
                <span className="text-muted-foreground">({country.code})</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {isCustom && (
        <Input
          value={customValue}
          onChange={(e) => onCustomChange?.(e.target.value)}
          placeholder="Enter custom code (e.g., uk, fr)"
          className="mt-2"
        />
      )}
    </div>
  );
}
