import { escapeHTML } from './exportData';

describe('escapeHTML', () => {
  it('escapes HTML special characters', () => {
    expect(escapeHTML('<b>Café & "amigos"</b>')).toBe(
      '&lt;b&gt;Café &amp; &quot;amigos&quot;&lt;/b&gt;'
    );
  });

  it('returns an empty string for null or undefined', () => {
    expect(escapeHTML(null)).toBe('');
    expect(escapeHTML(undefined)).toBe('');
  });

  it('coerces non-string values to string', () => {
    expect(escapeHTML(123)).toBe('123');
  });
});
