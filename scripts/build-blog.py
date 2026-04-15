#!/usr/bin/env python3
"""
Blog build script for Iudex.
Reads blog/posts.json and generates:
  - Published post files in blog/ (copied from blog/drafts/ with fixed paths)
  - Blog grid cards in blog/index.html
  - Featured post section in blog/index.html
  - Blog preview cards in index.html (homepage, first 3 published)
  - Filter bar buttons in blog/index.html

Usage: python3 scripts/build-blog.py
"""

import json
import os
import shutil
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BLOG_DIR = os.path.join(ROOT, 'blog')
DRAFTS_DIR = os.path.join(BLOG_DIR, 'drafts')
POSTS_JSON = os.path.join(BLOG_DIR, 'posts.json')
BLOG_INDEX = os.path.join(BLOG_DIR, 'index.html')
HOME_INDEX = os.path.join(ROOT, 'index.html')

ARROW_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M5 12h14M12 5l7 7-7 7"/></svg>'


def load_posts():
    with open(POSTS_JSON, 'r', encoding='utf-8') as f:
        return json.load(f)['posts']


def publish_file(slug):
    """Copy a draft to blog/ with paths rewritten from ../../ to ../"""
    src = os.path.join(DRAFTS_DIR, f'{slug}.html')
    dst = os.path.join(BLOG_DIR, f'{slug}.html')
    if not os.path.exists(src):
        print(f'  Warning: draft not found: {src}')
        return
    with open(src, 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace('../../', '../')
    content = content.replace('href="../index.html"', 'href="index.html"')
    with open(dst, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'  Published: blog/{slug}.html')


def unpublish_file(slug):
    """Remove published file from blog/ if it exists (keeps draft safe)."""
    dst = os.path.join(BLOG_DIR, f'{slug}.html')
    if os.path.exists(dst):
        os.remove(dst)
        print(f'  Unpublished: blog/{slug}.html')


def delay_class(index):
    """Return stagger delay class based on position in grid."""
    mod = index % 3
    if mod == 0:
        return ''
    return f' delay-{mod}'


def build_blog_card(post, index):
    """Generate a blog-grid card for blog/index.html."""
    is_placeholder = post.get('placeholder', False)
    is_published = post.get('published', False)
    delay = delay_class(index)
    stroke_opacity = '0.25' if is_placeholder else '0.4'
    category = post['category']
    grad = post['thumbGradient']

    if is_placeholder:
        return f'''      <div class="blog-card animate-on-scroll{delay}" data-category="{category}" style="cursor:default;opacity:0.65">
        <div class="blog-card__thumb" style="background:linear-gradient(135deg,{grad})">
          <div class="blog-card__thumb-inner">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="rgba(201,168,76,{stroke_opacity})" stroke-width="1">{post['icon']}</svg>
          </div>
          <span class="blog-card__category">{post['categoryLabel']}</span>
        </div>
        <div class="blog-card__body">
          <div class="blog-card__meta">
            <span class="blog-card__author">{post['author']}</span>
            <div class="blog-card__dot"></div>
            <span class="blog-card__date">{post['date']}</span>
          </div>
          <h3>{post['title']}</h3>
          <p>{post['description']}</p>
          <span class="blog-card__link" style="color:var(--ink-muted)">Próximamente</span>
        </div>
      </div>'''

    href = f'{post["slug"]}.html' if is_published else f'drafts/{post["slug"]}.html'
    read_meta = ''
    if post.get('readTime'):
        read_meta = f'''
            <div class="blog-card__dot"></div>
            <span class="blog-card__read">{post['readTime']}</span>'''

    return f'''      <a href="{href}" class="blog-card animate-on-scroll{delay}" data-category="{category}">
        <div class="blog-card__thumb" style="background:linear-gradient(135deg,{grad})">
          <div class="blog-card__thumb-inner">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="rgba(201,168,76,{stroke_opacity})" stroke-width="1">{post['icon']}</svg>
          </div>
          <span class="blog-card__category">{post['categoryLabel']}</span>
        </div>
        <div class="blog-card__body">
          <div class="blog-card__meta">
            <span class="blog-card__author">{post['author']}</span>
            <div class="blog-card__dot"></div>
            <span class="blog-card__date">{post['date']}</span>{read_meta}
          </div>
          <h3>{post['title']}</h3>
          <p>{post['description']}</p>
          <span class="blog-card__link">Leer artículo {ARROW_SVG}</span>
        </div>
      </a>'''


def build_newsletter_card():
    """Generate the newsletter subscription card."""
    return '''      <div class="blog-card animate-on-scroll" style="background:var(--ink);border-color:transparent;cursor:default">
        <div class="blog-card__body" style="justify-content:center;text-align:center;gap:16px">
          <div style="width:48px;height:48px;border-radius:12px;background:rgba(201,168,76,0.15);display:flex;align-items:center;justify-content:center;margin:0 auto 8px">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--gold)" stroke-width="1.5" width="24" height="24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          </div>
          <h3 style="color:var(--cream);font-size:1.15rem">Recibí los nuevos artículos</h3>
          <p style="color:rgba(247,244,238,0.55);font-size:0.85rem">Sin spam. Solo contenido útil para profesionales del derecho, cada dos semanas.</p>
          <form class="newsletter__form js-email-form" style="flex-direction:column;max-width:100%;margin:0;gap:10px" novalidate>
            <input type="email" class="newsletter__input" placeholder="tu@email.com" aria-label="Email" required style="background:rgba(247,244,238,0.08);border-color:rgba(247,244,238,0.12);color:var(--cream)" />
            <button type="submit" class="btn btn--gold" style="width:100%;justify-content:center">Suscribirme</button>
          </form>
        </div>
      </div>'''


def build_featured_post(post):
    """Generate the featured post section for blog/index.html."""
    is_published = post.get('published', False)
    href = f'{post["slug"]}.html' if is_published else f'drafts/{post["slug"]}.html'
    desc = post.get('featuredDescription', post['description'])

    return f'''    <p class="label" style="margin-bottom:20px">Artículo destacado</p>
    <a href="{href}" class="featured-post animate-on-scroll">
      <div class="featured-post__thumb">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="rgba(201,168,76,0.35)" stroke-width="0.8">
          {post['icon']}
        </svg>
        <span class="featured-post__badge">⭐ Destacado</span>
      </div>
      <div class="featured-post__body">
        <div class="featured-post__meta">
          <span class="post-category-badge">{post['categoryLabel']}</span>
          <span class="blog-card__date">{post['date']}</span>
          <div class="blog-card__dot"></div>
          <span class="blog-card__read">{post['readTime']}</span>
        </div>
        <h2>{post['title']}</h2>
        <p>{desc}</p>
        <span class="btn btn--primary" style="display:inline-flex;margin-top:8px">
          Leer artículo
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </span>
      </div>
    </a>'''


def build_preview_card(post, number):
    """Generate a homepage blog preview card."""
    is_published = post.get('published', False)
    href = f'blog/{post["slug"]}.html' if is_published else f'blog/drafts/{post["slug"]}.html'
    num = f'{number:02d}'
    delay = delay_class(number - 1)
    grad = post['thumbGradient']

    return f'''      <a href="{href}" class="blog-card animate-on-scroll{delay}" data-category="{post['category']}">
        <div class="blog-card__thumb" style="background: linear-gradient(135deg, {grad.split(",")[0]} 0%, {grad.split(",")[1]} 100%);">
          <div class="blog-card__thumb-inner">
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="rgba(201,168,76,0.4)" stroke-width="1">{post['icon']}</svg>
          </div>
          <span class="blog-card__thumb-number">{num}</span>
          <span class="blog-card__category">{post['categoryLabel']}</span>
        </div>
        <div class="blog-card__body">
          <div class="blog-card__meta">
            <span class="blog-card__date">{post['date']}</span>
            <div class="blog-card__dot"></div>
            <span class="blog-card__read">{post['readTime']}</span>
          </div>
          <h3>{post['title']}</h3>
          <p>{post['description']}</p>
          <span class="blog-card__link">
            Leer artículo
            {ARROW_SVG}
          </span>
        </div>
      </a>'''


def build_filter_bar(posts):
    """Generate filter bar buttons from unique categories in posts."""
    categories = []
    seen = set()
    for p in posts:
        cat = p['category']
        if cat not in seen:
            seen.add(cat)
            categories.append((cat, p['categoryLabel']))

    buttons = ['        <button class="filter-btn active" data-filter="all">Todos</button>']
    for cat, label in categories:
        buttons.append(f'        <button class="filter-btn" data-filter="{cat}">{label}</button>')
    return '\n'.join(buttons)


def replace_section(html, start_marker, end_marker, new_content):
    """Replace content between HTML marker comments."""
    pattern = re.compile(
        rf'({re.escape(start_marker)}\n)(.*?)(\n\s*{re.escape(end_marker)})',
        re.DOTALL
    )
    match = pattern.search(html)
    if not match:
        print(f'  Warning: markers not found: {start_marker}')
        return html
    return pattern.sub(rf'\g<1>{new_content}\g<3>', html)


def main():
    posts = load_posts()

    # --- Step 1: Publish/unpublish files ---
    print('Managing post files...')
    for post in posts:
        if post.get('placeholder'):
            continue
        if post['published']:
            publish_file(post['slug'])
        else:
            unpublish_file(post['slug'])

    # --- Step 2: Build blog/index.html sections ---
    print('Building blog/index.html...')
    with open(BLOG_INDEX, 'r', encoding='utf-8') as f:
        blog_html = f.read()

    # Featured post (only if published)
    featured = next((p for p in posts if p.get('featured') and p.get('published')), None)
    if featured:
        featured_html = build_featured_post(featured)
    else:
        featured_html = '    <!-- No featured post published -->'
    blog_html = replace_section(blog_html,
        '<!-- BLOG-FEATURED:START -->', '<!-- BLOG-FEATURED:END -->',
        featured_html)

    # Filter bar (only categories from visible posts)
    visible_posts = [p for p in posts if p.get('published') or p.get('placeholder')]
    filter_html = build_filter_bar(visible_posts)
    blog_html = replace_section(blog_html,
        '<!-- BLOG-FILTERS:START -->', '<!-- BLOG-FILTERS:END -->',
        filter_html)

    # Blog grid (only published + placeholder posts)
    cards = []
    for i, post in enumerate(visible_posts):
        cards.append(build_blog_card(post, i))
    cards.append(build_newsletter_card())
    grid_html = '\n\n'.join(cards)
    blog_html = replace_section(blog_html,
        '<!-- BLOG-GRID:START -->', '<!-- BLOG-GRID:END -->',
        grid_html)

    with open(BLOG_INDEX, 'w', encoding='utf-8') as f:
        f.write(blog_html)
    print('  Updated blog/index.html')

    # --- Step 3: Build homepage blog preview ---
    print('Building index.html blog preview...')
    with open(HOME_INDEX, 'r', encoding='utf-8') as f:
        home_html = f.read()

    # First 3 published (non-placeholder) posts for homepage preview
    preview_posts = [p for p in posts if p.get('published') and not p.get('placeholder')][:3]
    preview_cards = []
    for i, post in enumerate(preview_posts):
        preview_cards.append(build_preview_card(post, i + 1))
    preview_html = '\n\n'.join(preview_cards)
    home_html = replace_section(home_html,
        '<!-- BLOG-PREVIEW:START -->', '<!-- BLOG-PREVIEW:END -->',
        preview_html)

    with open(HOME_INDEX, 'w', encoding='utf-8') as f:
        f.write(home_html)
    print('  Updated index.html')

    # --- Summary ---
    published = [p for p in posts if p['published'] and not p.get('placeholder')]
    drafts = [p for p in posts if not p['published'] and not p.get('placeholder')]
    placeholders = [p for p in posts if p.get('placeholder')]
    print(f'\nDone! {len(published)} published, {len(drafts)} drafts, {len(placeholders)} placeholders.')


if __name__ == '__main__':
    main()
