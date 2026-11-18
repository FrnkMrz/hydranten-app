const PRODUCTION_STYLE_DIRECTIVE = "style-src 'self';";
const DEVELOPMENT_STYLE_DIRECTIVE = `${PRODUCTION_STYLE_DIRECTIVE}\n    style-src-elem 'self' 'unsafe-inline';`;

export function createDevCspStylePlugin() {
  return {
    name: 'dev-csp-style-elements',
    apply: 'serve',
    transformIndexHtml(html) {
      return html.replace(PRODUCTION_STYLE_DIRECTIVE, DEVELOPMENT_STYLE_DIRECTIVE);
    },
  };
}
