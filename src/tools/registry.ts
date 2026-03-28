import * as z from 'zod';
import { getAvailableReviews, getSkill, getSkillContent, formatAvailableReviews } from '../skills/loader.js';
import type { ScopeMode } from '../skills/types.js';
import { ETHOS_MD } from '../embedded/ethos.js';
import { GSTACK_VOICE_RULES, ETHOS_PRINCIPLES } from '../utils/voice.js';

const scopeModeSchema = z.enum(['expansion', 'selective', 'hold', 'reduction']);

function wrapResponse(text: string) {
  return { content: [{ type: 'text' as const, text }] };
}

function makeReviewDocument(options: {
  name: string;
  title: string;
  contextLines: string[];
  skillContent: string;
  methodology: string[];
}) {
  return [
    `# ${options.title}`,
    '',
    '## Context',
    ...options.contextLines.map((line) => `- ${line}`),
    '',
    '## GStack voice',
    GSTACK_VOICE_RULES,
    '',
    '## Ethos',
    ETHOS_PRINCIPLES,
    '',
    '## Embedded skill instructions',
    options.skillContent,
    '',
    '## Methodology',
    ...options.methodology.map((step, index) => `${index + 1}. ${step}`),
    '',
    '## Output shape',
    '- concise verdict',
    '- key risks',
    '- concrete next steps',
  ].join('\n');
}

function buildMethodology(scopeMode?: ScopeMode) {
  const base = [
    'State the recommendation up front.',
    'Name the strongest concern first.',
    'Show the smallest complete path forward.',
    'Call out edge cases and missing decisions.',
    'End with what to do next.',
  ];

  if (scopeMode === 'expansion') {
    base.splice(2, 0, 'Add the better version if it is cheap enough to do now.');
  }

  if (scopeMode === 'reduction') {
    base.splice(2, 0, 'Cut anything not required to ship the core outcome.');
  }

  return base;
}

export const toolDefinitions = {
  'list-available-reviews': {
    schema: z.object({}).strict(),
    handler: async () => wrapResponse(formatAvailableReviews(true)),
  },
  'plan-ceo-review': {
    schema: z.object({
      planContent: z.string().min(1),
      scopeMode: scopeModeSchema.optional(),
      additionalContext: z.string().optional(),
    }),
    handler: async ({ planContent, scopeMode, additionalContext }: { planContent: string; scopeMode?: ScopeMode; additionalContext?: string }) => {
      const text = makeReviewDocument({
        name: 'plan-ceo-review',
        title: 'CEO Review',
        contextLines: [
          `Scope mode: ${scopeMode ?? 'hold'}`,
          additionalContext ? `Additional context: ${additionalContext}` : 'Additional context: none',
          `Plan size: ${planContent.length} characters`,
        ],
        skillContent: getSkillContent('ceo-review'),
        methodology: buildMethodology(scopeMode),
      });
      return wrapResponse(text);
    },
  },
  'design-consultation': {
    schema: z.object({
      productDescription: z.string().optional(),
      projectType: z.string().optional(),
      existingDesignMd: z.string().optional(),
    }),
    handler: async ({ productDescription, projectType, existingDesignMd }: { productDescription?: string; projectType?: string; existingDesignMd?: string }) => {
      const text = makeReviewDocument({
        name: 'design-consultation',
        title: 'Design Consultation',
        contextLines: [
          productDescription ? `Product description: ${productDescription}` : 'Product description: not provided',
          projectType ? `Project type: ${projectType}` : 'Project type: not provided',
          existingDesignMd ? `Existing DESIGN.md provided: yes` : 'Existing DESIGN.md provided: no',
        ],
        skillContent: getSkillContent('design-consult'),
        methodology: [
          'Start from the product and audience.',
          'Propose a complete visual system.',
          'Call out safe choices and risks.',
          'Translate the direction into implementation-ready guidance.',
        ],
      });
      return wrapResponse(text);
    },
  },
  'plan-design-review': {
    schema: z.object({
      planContent: z.string().min(1),
      designMd: z.string().optional(),
    }),
    handler: async ({ planContent, designMd }: { planContent: string; designMd?: string }) => {
      const text = makeReviewDocument({
        name: 'plan-design-review',
        title: 'Design Review',
        contextLines: [
          `Plan size: ${planContent.length} characters`,
          designMd ? 'Existing DESIGN.md provided: yes' : 'Existing DESIGN.md provided: no',
        ],
        skillContent: getSkillContent('design-review'),
        methodology: [
          'Check information hierarchy.',
          'Check interaction states and edge cases.',
          'Check the emotional arc and user journey.',
          'Check for generic patterns and missing specificity.',
          'Check responsive behavior and accessibility.',
        ],
      });
      return wrapResponse(text);
    },
  },
  'plan-eng-review': {
    schema: z.object({
      planContent: z.string().min(1),
      testFramework: z.string().optional(),
      additionalContext: z.string().optional(),
    }),
    handler: async ({ planContent, testFramework, additionalContext }: { planContent: string; testFramework?: string; additionalContext?: string }) => {
      const text = makeReviewDocument({
        name: 'plan-eng-review',
        title: 'Engineering Review',
        contextLines: [
          `Plan size: ${planContent.length} characters`,
          testFramework ? `Test framework: ${testFramework}` : 'Test framework: not provided',
          additionalContext ? `Additional context: ${additionalContext}` : 'Additional context: none',
        ],
        skillContent: getSkillContent('eng-review'),
        methodology: [
          'Validate the architecture and boundaries.',
          'Trace the data flow and failure modes.',
          'Check test coverage and regression risk.',
          'Check performance and deployability.',
          'Call out anything that will hurt maintainability.',
        ],
      });
      return wrapResponse(text);
    },
  },
} as const;

export function registerReviewTools() {
  return toolDefinitions;
}

export function buildToolIndex() {
  return getAvailableReviews().map((skill) => ({
    toolName: skill.toolName,
    title: skill.title,
    description: skill.description,
    fileName: skill.fileName,
  }));
}
