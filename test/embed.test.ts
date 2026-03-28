import { expect, test } from 'bun:test';
import { stripSkillPreamble } from '../src/utils/embed.js';

test('stripSkillPreamble removes preamble and keeps voice content', () => {
  const input = [
    '---',
    'name: example',
    '---',
    '## Preamble (run first)',
    '',
    'aaaaa',
    '',
    '## Voice',
    '',
    'Keep this.',
    '',
    '## Other',
    'More.',
  ].join('\n');

  expect(stripSkillPreamble(input)).toBe('## Voice\n\nKeep this.\n\n## Other\nMore.');
});

test('stripSkillPreamble leaves text alone when there is no voice heading', () => {
  expect(stripSkillPreamble('hello world')).toBe('hello world');
});
