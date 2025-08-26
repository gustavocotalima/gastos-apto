// This component injects a script that runs before React hydration
// to prevent theme flashing on page load

export function ThemeScript() {
  const script = `
    (function() {
      try {
        // Check for saved theme preference or use system preference
        const savedTheme = localStorage.getItem('theme');
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme === 'dark' || (!savedTheme && systemDark)) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } catch (e) {
        // Fallback to system preference if localStorage fails
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          document.documentElement.classList.add('dark');
        }
      }
    })();
  `.trim()

  return (
    <script
      dangerouslySetInnerHTML={{ __html: script }}
      // This ensures the script runs before any React code
    />
  )
}