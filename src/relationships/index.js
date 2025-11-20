/**
 * Relationships Module - Component dependency and relationship analysis
 */

export { 
  findComponentsByTag,
  getAvailableTags,
  findSimilarComponents
} from './tag-searcher.js';

export { 
  analyzeComponentDependencies
} from './dependency-analyzer.js';

export { 
  buildRelationshipGraph
} from './graph-builder.js';

export { 
  analyzeComponentConflicts,
  suggestAlternatives
} from './conflict-analyzer.js';
