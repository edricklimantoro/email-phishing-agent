export const theme = {
  colors: {
    bg: {
      primary: '#ffffff',
      secondary: '#f5f5f5',
      tertiary: '#ebebeb',
    },
    text: {
      primary: '#0a0a0a',
      secondary: '#525252',
      muted: 'rgba(10, 10, 10, 0.45)',
    },
    accent: {
      primary: '#da627d',
      hover: '#fca17d',
    },
    status: {
      safe: '#16a34a',
      phishing: '#dc2626',
      violation: '#d97706',
      pending: '#6b7280',
      info: '#9a348e',
    },
    border: 'rgba(10, 10, 10, 0.10)',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
  },
  radius: {
    sm: '6px',
    md: '8px',
    lg: '12px',
    pill: '999px',
  },
  font: {
    family: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
    size: {
      display: '24px',
      heading: '20px',
      subheading: '16px',
      body: '14px',
      caption: '12px',
      data: '13px',
    },
    weight: {
      regular: 400,
      medium: 500,
      semibold: 600,
    },
  },
  breakpoints: {
    mobile: '640px',
    tablet: '768px',
    desktop: '1024px',
  },
} as const;
