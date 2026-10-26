import { describe, it, expect } from 'vitest';
import { cleanRichContent, stripHtml } from '../cleanRichContent';

describe('cleanRichContent Utility', () => {
  it('should wrap tables in responsive overflow-x-auto container with border-collapse', () => {
    const rawTable = '<table><tr><th>Feature</th><th>Spec</th></tr><tr><td>Shell</td><td>Carbon</td></tr></table>';
    const cleaned = cleanRichContent(rawTable);

    expect(cleaned).toContain('overflow-x-auto');
    expect(cleaned).toContain('border-collapse');
    expect(cleaned).toContain('<table class="w-full min-w-full');
  });

  it('should prevent double wrapping if table is already wrapped', () => {
    const doubleTable = '<div class="overflow-x-auto"><table><tr><td>Cell</td></tr></table></div>';
    const cleaned = cleanRichContent(doubleTable);

    // Count occurrences of overflow-x-auto
    const count = (cleaned.match(/overflow-x-auto/g) || []).length;
    expect(count).toBe(1);
  });

  it('should strip dangerous scripts and iframes', () => {
    const malicious = '<p>Safe</p><script>alert("hack")</script><iframe src="evil.com"></iframe>';
    const cleaned = cleanRichContent(malicious);

    expect(cleaned).not.toContain('<script');
    expect(cleaned).not.toContain('<iframe');
    expect(cleaned).toContain('Safe');
  });

  it('should strip inline javascript event handlers (onerror, onclick)', () => {
    const xss = '<img src="fake.jpg" onerror="alert(1)" onclick="steal()" />';
    const cleaned = cleanRichContent(xss);

    expect(cleaned).not.toContain('onerror');
    expect(cleaned).not.toContain('onclick');
    expect(cleaned).toContain('fake.jpg');
  });

  it('should rewrite legacy store4riders.com and .html URLs to internal Next.js routes', () => {
    const legacy = '<a href="https://www.store4riders.com/helmets/full-face-helmets.html">Full Face</a>';
    const cleaned = cleanRichContent(legacy);

    expect(cleaned).toContain('href="/helmets/full-face-helmets"');
    expect(cleaned).not.toContain('.html');
    expect(cleaned).not.toContain('https://www.store4riders.com');
  });

  it('should keep internal links dofollow and add nofollow to external links', () => {
    const mixed = '<p><a href="/motorcycle-helmets">Helmets</a> and <a href="https://youtube.com/watch?v=123">Review</a></p>';
    const cleaned = cleanRichContent(mixed);

    // Internal link is clean dofollow
    expect(cleaned).toContain('<a href="/motorcycle-helmets">Helmets</a>');
    expect(cleaned).not.toContain('<a href="/motorcycle-helmets" rel="nofollow');

    // External link has nofollow and target="_blank"
    expect(cleaned).toContain('href="https://youtube.com/watch?v=123" target="_blank" rel="nofollow noopener noreferrer"');
  });
});

describe('stripHtml Utility', () => {
  it('should cleanly strip all HTML tags and normalize whitespace for Googlebot schema', () => {
    const html = '<p>This is <strong>ECE 22.06</strong> certified with &nbsp; EPS liner.</p>';
    const stripped = stripHtml(html);

    expect(stripped).toBe('This is ECE 22.06 certified with EPS liner.');
    expect(stripped).not.toContain('<');
    expect(stripped).not.toContain('&nbsp;');
  });
});
