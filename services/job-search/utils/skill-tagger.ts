import { SupabaseClient } from '@supabase/supabase-js';

export interface MatchedSkill {
  id: string;
  name: string;
}

export async function tagJobSkills(
  title: string,
  description: string,
  supabase: SupabaseClient
): Promise<string[]> {
  try {
    // 1. Fetch all skills from the global database
    const { data: globalSkills, error } = await supabase
      .from('skills')
      .select('id, name');

    if (error || !globalSkills) {
      console.error('Failed to fetch global skills for tagging:', error?.message);
      return [];
    }

    const matchedSkillIds: string[] = [];
    const textToAnalyze = `${title} ${description}`;
    const textLower = ` ${textToAnalyze.toLowerCase()} `;
    const textPadded = ` ${textToAnalyze} `;

    // 2. Greedy match boundary rules
    for (const skill of globalSkills) {
      const skillName = skill.name.toLowerCase();
      let pattern: RegExp;

      // Handle 'go' case-sensitively to prevent verbal false positives
      if (skillName === 'go') {
        pattern = new RegExp('(?<![a-zA-Z0-9_#+-.])(Go|GO)(?![a-zA-Z0-9_#+-.])', 'g');
        if (pattern.test(textPadded)) {
          matchedSkillIds.push(skill.id);
        }
      } else {
        // Escape special chars
        const escaped = skillName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        pattern = new RegExp(`(?<![a-zA-Z0-9_#+-.])(${escaped})(?![a-zA-Z0-9_#+-.])`, 'gi');
        if (pattern.test(textLower)) {
          matchedSkillIds.push(skill.id);
        }
      }
    }

    return matchedSkillIds;

  } catch (err: any) {
    console.error('Error occurred during job skill tagging:', err.message);
    return [];
  }
}
