import { CEO_REVIEW_MD } from '../embedded/ceo-review.js';
import { DESIGN_CONSULT_MD } from '../embedded/design-consult.js';
import { DESIGN_REVIEW_MD } from '../embedded/design-review.js';
import { ENG_REVIEW_MD } from '../embedded/eng-review.js';
import type { ReviewSkill, ReviewSkillId } from './types.js';

const skills: ReviewSkill[] = [
  {
    id: 'ceo-review',
    toolName: 'plan-ceo-review',
    title: 'CEO review',
    description: 'Strategic product and scope review.',
    summary: 'Founder-level review focused on problem framing, scope, and product direction.',
    fileName: 'ceo-review.ts',
  },
  {
    id: 'design-consult',
    toolName: 'design-consultation',
    title: 'Design consultation',
    description: 'Design system and visual direction review.',
    summary: 'Creates a coherent design system direction with typography, color, layout, and motion.',
    fileName: 'design-consult.ts',
  },
  {
    id: 'design-review',
    toolName: 'plan-design-review',
    title: 'Design review',
    description: 'Plan review for information architecture and interaction design.',
    summary: 'Checks the plan for hierarchy, states, journey, accessibility, and AI slop risk.',
    fileName: 'design-review.ts',
  },
  {
    id: 'eng-review',
    toolName: 'plan-eng-review',
    title: 'Engineering review',
    description: 'Architecture, test, and performance review.',
    summary: 'Checks architecture, data flow, test coverage, and deployment risk.',
    fileName: 'eng-review.ts',
  },
];

const contentById: Record<ReviewSkillId, string> = {
  'ceo-review': CEO_REVIEW_MD,
  'design-consult': DESIGN_CONSULT_MD,
  'design-review': DESIGN_REVIEW_MD,
  'eng-review': ENG_REVIEW_MD,
};

export function getAvailableReviews() {
  return skills;
}

export function getSkill(skillId: ReviewSkillId) {
  return skills.find((skill) => skill.id === skillId)!;
}

export function getSkillContent(skillId: ReviewSkillId) {
  return contentById[skillId];
}

export function formatAvailableReviews(includeDiscoveryTool = true) {
  const lines = [
    '# Available reviews',
    '',
    '## Review tools',
    ...skills.map((skill) => `- **${skill.toolName}**: ${skill.summary}`),
  ];

  if (includeDiscoveryTool) {
    lines.push('', '## Discovery tool', '- **list-available-reviews**: Lists the review tools and their purpose.');
  }

  return lines.join('\n');
}
