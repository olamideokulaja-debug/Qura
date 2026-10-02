// The UK Code of Practice for international recruitment (gov.uk, last updated
// 27 March 2025): 54 red-list countries, where active recruitment is not
// permitted, and the amber list (Kenya, Nepal), where it is allowed only under
// a government-to-government agreement Qura is not part of. Advertising "through
// any medium" counts as active recruitment, so Qura sends no role alerts to
// clinicians living in these countries. They can still search and apply
// directly. Same list as PROTECTED_LIST in src/data/clinical.js; keep both in step.
export const PROTECTED_COUNTRIES = new Set(["Afghanistan", "Angola", "Bangladesh", "Benin", "Burkina Faso", "Burundi", "Cameroon", "Central African Republic", "Chad", "Comoros", "Congo", "Côte d'Ivoire", "Democratic Republic of the Congo", "Djibouti", "Equatorial Guinea", "Eritrea", "Ethiopia", "Gabon", "Ghana", "Guinea", "Guinea-Bissau", "Haiti", "Kenya", "Kiribati", "Laos", "Lesotho", "Liberia", "Madagascar", "Malawi", "Mali", "Mauritania", "Micronesia", "Mozambique", "Nepal", "Niger", "Nigeria", "Pakistan", "Papua New Guinea", "Rwanda", "Samoa", "Senegal", "Sierra Leone", "Solomon Islands", "Somalia", "South Sudan", "Sudan", "Tanzania", "The Gambia", "Timor-Leste", "Togo", "Tuvalu", "Uganda", "Vanuatu", "Yemen", "Zambia", "Zimbabwe"].map((c) => c.toLowerCase()));

export function protectedResident(profile) {
  const p = profile || {};
  return [p.country, p.residence].some((c) => typeof c === "string" && PROTECTED_COUNTRIES.has(c.trim().toLowerCase()));
}

export const PROTECTED_ALERT_MSG = "Qura does not send UK role alerts to clinicians living in a country on the UK Code of Practice red or amber list. You can still search every role and apply directly.";
