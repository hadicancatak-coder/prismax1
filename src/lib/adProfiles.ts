import logoImage from "@/assets/cfi-logo.png";

export const AD_PROFILES = {
  EN: {
    name: 'CFI Group',
    handle: '@cfigroup',
    avatar: logoImage,
    verified: true,
    followers: '50K',
    description: 'Global Financial Services Leader',
  },
  AR: {
    name: 'مجموعة CFI',
    handle: '@cfigroup_ar',
    avatar: logoImage,
    verified: true,
    followers: '50K',
    description: 'الشركة الرائدة في الخدمات المالية العالمية',
  }
};

export function getProfileForLanguage(language: string) {
  return language === 'AR' ? AD_PROFILES.AR : AD_PROFILES.EN;
}
