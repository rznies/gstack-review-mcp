import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripSkillPreamble } from '../src/utils/embed.js';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const sourceRoot = process.env.GSTACK_SKILL_ROOT ?? join(process.env.HOME ?? '', '.claude/skills/gstack');

const outputs = [
  { source: 'plan-ceo-review/SKILL.md', target: 'src/embedded/ceo-review.ts', exportName: 'CEO_REVIEW_MD' },
  { source: 'design-consultation/SKILL.md', target: 'src/embedded/design-consult.ts', exportName: 'DESIGN_CONSULT_MD' },
  { source: 'plan-design-review/SKILL.md', target: 'src/embedded/design-review.ts', exportName: 'DESIGN_REVIEW_MD' },
  { source: 'plan-eng-review/SKILL.md', target: 'src/embedded/eng-review.ts', exportName: 'ENG_REVIEW_MD' },
];

async function main() {
  const sourceExists = await maybeRead(join(sourceRoot, 'ETHOS.md'));
  if (!sourceExists) {
    console.log(`No gstack skill source found at ${sourceRoot}, keeping committed embedded files.`);
    return;
  }

  await mkdir(join(repoRoot, 'src/embedded'), { recursive: true });

  for (const item of outputs) {
    const sourcePath = join(sourceRoot, item.source);
    const source = await readFile(sourcePath, 'utf8');
    const stripped = stripSkillPreamble(source);
    await writeFile(join(repoRoot, item.target), toTsModule(item.exportName, stripped));
  }

  const ethos = await readFile(join(sourceRoot, 'ETHOS.md'), 'utf8');
  await writeFile(join(repoRoot, 'src/embedded/ethos.ts'), toTsModule('ETHOS_MD', ethos));
  console.log('Embedded gstack skills refreshed.');
}

async function maybeRead(path: string) {
  try {
    return await readFile(path, 'utf8');
  } catch {
    return null;
  }
}

function toTsModule(exportName: string, content: string) {
  return `export const ${exportName} = ${JSON.stringify(content.trim())} as const;\n`;
}

await main();
