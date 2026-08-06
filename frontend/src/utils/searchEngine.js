// Intelligent Search Engine with Fuzzy Auto-Correction & Autocomplete for MCubes Cafe

const TYPO_DICTIONARY = {
  chikn: 'chicken',
  chickn: 'chicken',
  chiken: 'chicken',
  chkn: 'chicken',
  chick: 'chicken',
  mogo: 'mojito',
  mojto: 'mojito',
  mojitt: 'mojito',
  mojitoo: 'mojito',
  momo: 'momos',
  moms: 'momos',
  barger: 'burger',
  burgar: 'burger',
  burgr: 'burger',
  noodel: 'noodles',
  nudel: 'noodles',
  nodle: 'noodles',
  lasy: 'lassi',
  lasi: 'lassi',
  lassiy: 'lassi',
  pner: 'paneer',
  paner: 'paneer',
  panner: 'paneer',
  chese: 'cheese',
  cheeze: 'cheese',
  chez: 'cheese',
  fres: 'fries',
  fry: 'fries',
  fryes: 'fries',
  magi: 'maggi',
  magge: 'maggi',
  maggy: 'maggi',
  shak: 'shakes',
  shakee: 'shakes',
  shakess: 'shakes',
  icecream: 'ice cream',
  icream: 'ice cream',
  iscream: 'ice cream',
  cofee: 'coffee',
  coffeee: 'coffee',
  coldcofee: 'cold coffee',
  soda: 'soda',
  faloda: 'falooda',
  falood: 'falooda',
};

/**
 * Calculates Levenshtein distance between two strings
 */
function levenshteinDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Normalizes query string and attempts auto-correction
 */
export function autoCorrectQuery(query, allItems = []) {
  if (!query || !query.trim()) return { correctedQuery: '', isCorrected: false, originalQuery: '' };

  const rawQuery = query.trim().toLowerCase();
  
  // 1. Direct Typo Dictionary Match
  if (TYPO_DICTIONARY[rawQuery]) {
    return {
      correctedQuery: TYPO_DICTIONARY[rawQuery],
      isCorrected: true,
      originalQuery: rawQuery
    };
  }

  // Check word by word for dictionary replacements
  const words = rawQuery.split(/\s+/);
  let wordCorrected = false;
  const correctedWords = words.map(w => {
    if (TYPO_DICTIONARY[w]) {
      wordCorrected = true;
      return TYPO_DICTIONARY[w];
    }
    return w;
  });

  if (wordCorrected) {
    return {
      correctedQuery: correctedWords.join(' '),
      isCorrected: true,
      originalQuery: rawQuery
    };
  }

  // 2. Fuzzy Levenshtein Match against vocabulary
  if (rawQuery.length >= 3 && allItems.length > 0) {
    const vocab = new Set();
    allItems.forEach(item => {
      if (item.name) vocab.add(item.name.toLowerCase());
      if (item.categoryName) vocab.add(item.categoryName.toLowerCase());
      item.name.toLowerCase().split(/\s+/).forEach(w => { if (w.length >= 3) vocab.add(w); });
    });

    let bestMatch = null;
    let minDistance = 3; // Max threshold distance

    for (const term of vocab) {
      const dist = levenshteinDistance(rawQuery, term);
      if (dist < minDistance) {
        minDistance = dist;
        bestMatch = term;
      }
    }

    if (bestMatch && minDistance <= 2 && minDistance > 0) {
      return {
        correctedQuery: bestMatch,
        isCorrected: true,
        originalQuery: rawQuery
      };
    }
  }

  return {
    correctedQuery: rawQuery,
    isCorrected: false,
    originalQuery: rawQuery
  };
}

/**
 * Returns real-time autocomplete suggestions as user types
 */
export function getSearchSuggestions(query, allItems = [], limit = 5) {
  if (!query || !query.trim() || query.length < 1) return [];

  const q = query.trim().toLowerCase();
  const suggestionsMap = new Map();

  // Check exact/prefix matches first
  allItems.forEach(item => {
    const itemName = item.name;
    const catName = item.categoryName || '';

    if (itemName.toLowerCase().startsWith(q) || itemName.toLowerCase().includes(q)) {
      suggestionsMap.set(itemName, { type: 'dish', text: itemName, cat: catName });
    } else if (catName.toLowerCase().startsWith(q)) {
      suggestionsMap.set(`category-${catName}`, { type: 'category', text: catName, cat: catName });
    }
  });

  const results = Array.from(suggestionsMap.values());
  return results.slice(0, limit);
}
