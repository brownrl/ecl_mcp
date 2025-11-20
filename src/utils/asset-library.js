/**
 * ECL Asset Library
 * 
 * Centralized management for ECL assets (logos, icons, fonts, etc.)
 * Ensures correct paths and CDN URLs are used across the application.
 */

const ECL_VERSION = '4.11.1';
const CDN_BASE_EC = `https://cdn1.fpfis.tech.ec.europa.eu/ecl/v${ECL_VERSION}/ec`;
const CDN_BASE_EU = `https://cdn1.fpfis.tech.ec.europa.eu/ecl/v${ECL_VERSION}/eu`;

/**
 * Get the base CDN URL for a given preset
 * @param {string} preset - 'ec' or 'eu'
 * @returns {string} Base CDN URL
 */
export function getCdnBase(preset = 'ec') {
  return preset === 'eu' ? CDN_BASE_EU : CDN_BASE_EC;
}

/**
 * Get logo URL
 * @param {Object} options - Logo options
 * @param {string} options.preset - 'ec' or 'eu'
 * @param {string} options.variant - 'positive' (color) or 'negative' (white)
 * @param {string} options.language - Language code (e.g., 'en', 'fr')
 * @returns {string} Full CDN URL for the logo
 */
export function getLogoUrl({ preset = 'ec', variant = 'positive', language = 'en' } = {}) {
  const base = getCdnBase(preset);
  const type = variant === 'negative' ? 'negative' : 'positive';
  
  // EC Logo format: logo-ec--en.svg
  // EU Logo format: logo-eu--en.svg
  const logoName = `logo-${preset}--${language}.svg`;
  
  return `${base}/images/logo/${type}/${logoName}`;
}

/**
 * Get icon sprite URL
 * @param {Object} options - Icon options
 * @param {string} options.preset - 'ec' or 'eu'
 * @returns {string} Full CDN URL for the icon sprite
 */
export function getIconSpriteUrl({ preset = 'ec' } = {}) {
  const base = getCdnBase(preset);
  return `${base}/images/icons/sprites/icons.svg`;
}

/**
 * Get all CDN resources for a preset
 * @param {string} preset - 'ec' or 'eu'
 * @returns {Object} Collection of resource URLs
 */
export function getAllResources(preset = 'ec') {
  const base = getCdnBase(preset);
  
  return {
    styles: {
      main: `${base}/styles/ecl-${preset}.css`,
      print: `${base}/styles/ecl-${preset}-print.css`,
      reset: `${base}/styles/optional/ecl-reset.css`,
      utilities: `${base}/styles/optional/ecl-${preset}-utilities.css`
    },
    scripts: {
      main: `${base}/scripts/ecl-${preset}.js`
    },
    images: {
      icons_sprite: getIconSpriteUrl({ preset }),
      logo_positive: getLogoUrl({ preset, variant: 'positive', language: 'en' }),
      logo_negative: getLogoUrl({ preset, variant: 'negative', language: 'en' })
    }
  };
}

/**
 * Get idiomatic HTML for a logo
 * @param {Object} options - Logo options
 * @param {string} options.preset - 'ec' or 'eu'
 * @param {string} options.variant - 'positive' or 'negative'
 * @param {string} options.language - Language code
 * @param {string} options.class - Optional CSS class
 * @returns {string} HTML string
 */
export function getLogoHtml({ preset = 'ec', variant = 'positive', language = 'en', className = 'ecl-site-header__logo-image' } = {}) {
  const url = getLogoUrl({ preset, variant, language });
  const alt = preset === 'ec' ? 'European Commission' : 'European Union';
  
  return `<img alt="${alt}" title="${alt}" class="${className}" src="${url}" />`;
}
