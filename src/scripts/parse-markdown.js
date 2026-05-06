import MarkdownIt from 'markdown-it';

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: false,
  breaks: false,
});

export function renderBody(markdown) {
  if (!markdown) return '';
  return md.render(markdown);
}

export { md };
