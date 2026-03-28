export type ScopeMode = 'expansion' | 'selective' | 'hold' | 'reduction';

export type ReviewSkillId = 'ceo-review' | 'design-consult' | 'design-review' | 'eng-review';

export type ReviewToolName =
  | 'list-available-reviews'
  | 'plan-ceo-review'
  | 'design-consultation'
  | 'plan-design-review'
  | 'plan-eng-review';

export type ReviewSkill = {
  id: ReviewSkillId;
  toolName: Exclude<ReviewToolName, 'list-available-reviews'>;
  title: string;
  description: string;
  summary: string;
  fileName: string;
};
