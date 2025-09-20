
import {
  AMBIANCE_KEYWORDS,
  TIME_PATTERNS,
  OCCASION_KEYWORDS,
  WEATHER_KEYWORDS,
  SEASON_KEYWORDS,
  GROUP_SIZE_KEYWORDS,
  BUDGET_KEYWORDS,
} from "./Keywords";

export class KeywordManager {
  // Pre-computed keyword set for O(1) lookup
  private static readonly KEYWORD_SET = new Set([
    ...AMBIANCE_KEYWORDS,
    ...TIME_PATTERNS,
    ...OCCASION_KEYWORDS,
    ...WEATHER_KEYWORDS,
    ...SEASON_KEYWORDS,
    ...GROUP_SIZE_KEYWORDS,
    ...BUDGET_KEYWORDS,
  ]);

  // find keyword with a single pass through keyword set
  static findKeywords(text: string): string[] {
    const lowerText = text.toLowerCase(); // text we're comparing to
    const found: string[] = []; // set of found keywords

    // Single pass through text with Set lookup
    for (const keyword of this.KEYWORD_SET) {
      if (lowerText.includes(keyword.toLowerCase())) {
        found.push(keyword);
      }
    }

    return found;
  }
}

export default KeywordManager;
