import MarkdownIt from 'markdown-it';

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: false,
  breaks: false,
});

// Phase 7-fix-1 (B)：demote markdown body <h1> → <h2>
//
// 動機：
//   article header 已輸出 <h1 class="lab-article__title">；markdown body 第一行若以 # 開頭，
//   markdown-it 預設會 render 成另一個 <h1>，造成一頁兩個 <h1>，違反 SEO「一頁一 H1」慣例。
//
// 範圍：
//   body 內**所有** <h1> 都降為 <h2>（含 heading_open 與 heading_close 兩個 token）。
//   其他 heading level (h2..h6) 不變。
//
// 影響：
//   GitHub 站 (build-github.js) 與 Blogger build (build-blogger.js) 共用此 renderBody，
//   兩端同步生效。Blogger summary mode 通常不 render 整段 body，影響範圍主要是 detail / full。
//
// 實作：
//   覆寫 markdown-it 的 heading_open / heading_close renderer rules。
//   只在 token.tag === 'h1' 時把 tag 改為 'h2'，其餘交回預設 self.renderToken。
//   note：本檔不處理 setext-style H1 (`=====` 形式) — markdown-it 解析後的 token.tag 同樣是 h1，
//   故覆寫 renderer 即可同時涵蓋 ATX 與 setext。
//
// 防呆：
//   搭配 validate-content.js 的 body-leading-h1 規則，提示作者直接以 ## 起手；
//   搭配 new-post.js 的 template scaffolding，從源頭規範。
md.renderer.rules.heading_open = function (tokens, idx, options, env, self) {
  const token = tokens[idx];
  if (token.tag === 'h1') {
    token.tag = 'h2';
    token.markup = '##';
  }
  return self.renderToken(tokens, idx, options);
};

md.renderer.rules.heading_close = function (tokens, idx, options, env, self) {
  const token = tokens[idx];
  if (token.tag === 'h1') {
    token.tag = 'h2';
    token.markup = '##';
  }
  return self.renderToken(tokens, idx, options);
};

export function renderBody(markdown) {
  if (!markdown) return '';
  return md.render(markdown);
}

export { md };
