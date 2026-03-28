export function stripSkillPreamble(markdown: string): string {
  const voiceIndex = markdown.indexOf('\n## Voice\n');
  if (voiceIndex === -1) {
    return markdown.trim();
  }

  return markdown.slice(voiceIndex + 1).trim();
}
