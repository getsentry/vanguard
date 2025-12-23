/**
 * Script to handle theme initialization on page load
 * This prevents flash of unstyled content (FOUC) when the page first loads
 */
export function ThemeScript() {
  const themeScript = `
    (function() {
      function getTheme() {
        const theme = localStorage.getItem('theme');
        if (theme && ['light', 'dark', 'system'].includes(theme)) {
          return theme;
        }
        return 'system';
      }
      
      function applyTheme(theme) {
        if (theme === 'system') {
          const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
          document.documentElement.classList.toggle('dark', systemTheme === 'dark');
        } else {
          document.documentElement.classList.toggle('dark', theme === 'dark');
        }
      }
      
      const theme = getTheme();
      applyTheme(theme);
      
      // Listen for system theme changes if using system setting
      if (theme === 'system') {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', () => applyTheme('system'));
      }
    })();
  `;

  return (
    <script
      dangerouslySetInnerHTML={{
        __html: themeScript,
      }}
    />
  );
}
