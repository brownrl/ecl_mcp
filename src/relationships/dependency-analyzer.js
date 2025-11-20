/**
 * Component Dependency Analysis
 * Analyze what components require or work with
 */

import Database from 'better-sqlite3';

/**
 * Analyze component dependencies
 * @param {Database} db - SQLite database instance
 * @param {string} componentName - Component to analyze
 * @param {Object} options - Options
 * @param {boolean} options.include_suggestions - Include suggested components
 * @param {boolean} options.include_conflicts - Include conflicting components
 * @param {boolean} options.recursive - Follow dependency chain
 * @returns {Object} Dependency analysis
 */
export function analyzeComponentDependencies(db, componentName, options = {}) {
  const startTime = Date.now();

  try {
    const {
      include_suggestions = true,
      include_conflicts = true,
      recursive = false
    } = options;

    // Find component
    const component = db.prepare(`
      SELECT 
        p.id, 
        p.component_name, 
        p.title, 
        p.url,
        cm.complexity,
        cm.status,
        cm.requires_js,
        cm.framework_specific
      FROM pages p
      LEFT JOIN component_metadata cm ON p.id = cm.page_id
      WHERE LOWER(p.component_name) = LOWER(?)
      LIMIT 1
    `).get(componentName);

    if (!component) {
      return {
        success: false,
        error: `Component '${componentName}' not found`,
        metadata: { execution_time_ms: Date.now() - startTime }
      };
    }

    // Get code examples to detect external dependencies
    const examples = db.prepare(`
      SELECT code, language
      FROM code_examples
      WHERE page_id = ?
    `).all(component.id);

    // Analyze code for ECL dependencies
    const externalDeps = analyzeExternalDependencies(examples);

    // Get usage guidance for dependency hints
    const guidance = db.prepare(`
      SELECT guidance_type, content
      FROM usage_guidance
      WHERE page_id = ?
    `).all(component.id);

    // Parse guidance for implicit dependencies
    const implicitDeps = extractImplicitDependencies(guidance);

    // Check if component requires JavaScript
    const requiresJs = component.requires_js || 
                       externalDeps.scripts.length > 0 ||
                       examples.some(e => e.language === 'javascript');

    // Build dependency tree
    const dependencies = {
      required: {
        ecl_styles: externalDeps.stylesheets,
        ecl_scripts: requiresJs ? externalDeps.scripts : [],
        other_components: implicitDeps.required,
        framework: component.framework_specific ? 'Specific framework required' : 'Vanilla JS compatible'
      },
      suggested: include_suggestions ? {
        commonly_paired: implicitDeps.suggested,
        enhancement_options: implicitDeps.enhancements
      } : undefined,
      conflicts: include_conflicts ? {
        incompatible_components: implicitDeps.conflicts,
        warnings: implicitDeps.warnings
      } : undefined
    };

    // Get accessibility requirements as dependencies
    const a11yReqs = db.prepare(`
      SELECT requirement_type, wcag_criterion, description
      FROM accessibility_requirements
      WHERE page_id = ?
    `).all(component.id);

    // Recursive dependency resolution
    let dependencyChain = [];
    if (recursive && implicitDeps.required.length > 0) {
      dependencyChain = resolveDependencyChain(db, implicitDeps.required);
    }

// Generate installation notes (always include at least basic ECL setup)
  const notes = generateInstallationNotes(dependencies, component);

  return {
    success: true,
    component: {
      name: component.component_name,
      title: component.title,
      complexity: component.complexity || 'moderate',
      requires_javascript: requiresJs,
      framework_specific: component.framework_specific || false
    },
    dependencies: dependencies,
    accessibility_requirements: a11yReqs.map(r => ({
      requirement: r.requirement_type,
      wcag_criterion: r.wcag_criterion,
      description: r.description
    })),
    dependency_chain: recursive ? dependencyChain : undefined,
    installation_notes: notes,
      metadata: {
        execution_time_ms: Date.now() - startTime,
        total_dependencies: countDependencies(dependencies)
      }
    };

  } catch (error) {
    return {
      success: false,
      error: `Dependency analysis failed: ${error.message}`,
      metadata: { execution_time_ms: Date.now() - startTime }
    };
  }
}

/**
 * Analyze code examples for external dependencies
 */
function analyzeExternalDependencies(examples) {
  const stylesheets = new Set();
  const scripts = new Set();

  examples.forEach(ex => {
    if (ex.language === 'html') {
      // Extract stylesheet links
      const cssMatches = ex.code.match(/<link[^>]+href=["']([^"']+\.css)["']/gi) || [];
      cssMatches.forEach(match => {
        const href = match.match(/href=["']([^"']+)["']/i)?.[1];
        if (href) stylesheets.add(href);
      });

      // Extract script tags
      const jsMatches = ex.code.match(/<script[^>]+src=["']([^"']+\.js)["']/gi) || [];
      jsMatches.forEach(match => {
        const src = match.match(/src=["']([^"']+)["']/i)?.[1];
        if (src) scripts.add(src);
      });
    }
  });

  return {
    stylesheets: Array.from(stylesheets),
    scripts: Array.from(scripts)
  };
}

/**
 * Extract implicit dependencies from usage guidance
 */
function extractImplicitDependencies(guidance) {
  const required = [];
  const suggested = [];
  const enhancements = [];
  const conflicts = [];
  const warnings = [];

  guidance.forEach(g => {
    const content = g.content.toLowerCase();

    // Look for "requires", "needs", "must use"
    if (content.includes('requires') || content.includes('must use') || content.includes('needs')) {
      const componentMatches = content.match(/(?:requires|must use|needs)\s+(?:the\s+)?([a-z-]+(?:\s+[a-z-]+)?)/gi) || [];
      componentMatches.forEach(match => {
        const comp = match.replace(/(?:requires|must use|needs)\s+(?:the\s+)?/i, '').trim();
        if (comp && !required.includes(comp)) {
          required.push(comp);
        }
      });
    }

    // Look for "recommended", "suggested", "works well with"
    if (content.includes('recommended') || content.includes('suggested') || content.includes('works well with')) {
      const componentMatches = content.match(/(?:recommended|suggested|works well with)\s+(?:the\s+)?([a-z-]+(?:\s+[a-z-]+)?)/gi) || [];
      componentMatches.forEach(match => {
        const comp = match.replace(/(?:recommended|suggested|works well with)\s+(?:the\s+)?/i, '').trim();
        if (comp && !suggested.includes(comp)) {
          suggested.push(comp);
        }
      });
    }

    // Look for "can be enhanced", "optionally"
    if (content.includes('can be enhanced') || content.includes('optionally') || content.includes('optional')) {
      const componentMatches = content.match(/(?:enhanced with|optionally|optional)\s+(?:the\s+)?([a-z-]+(?:\s+[a-z-]+)?)/gi) || [];
      componentMatches.forEach(match => {
        const comp = match.replace(/(?:enhanced with|optionally|optional)\s+(?:the\s+)?/i, '').trim();
        if (comp && !enhancements.includes(comp)) {
          enhancements.push(comp);
        }
      });
    }

    // Look for conflicts: "don't use with", "incompatible", "conflicts with"
    if (content.includes("don't use with") || content.includes('incompatible') || content.includes('conflicts with')) {
      const componentMatches = content.match(/(?:don't use with|incompatible with|conflicts with)\s+(?:the\s+)?([a-z-]+(?:\s+[a-z-]+)?)/gi) || [];
      componentMatches.forEach(match => {
        const comp = match.replace(/(?:don't use with|incompatible with|conflicts with)\s+(?:the\s+)?/i, '').trim();
        if (comp && !conflicts.includes(comp)) {
          conflicts.push(comp);
        }
      });
    }

    // Look for warnings
    if (content.includes('warning') || content.includes('caution') || content.includes('avoid')) {
      warnings.push(g.content.substring(0, 200));
    }
  });

  return {
    required: required,
    suggested: suggested,
    enhancements: enhancements,
    conflicts: conflicts,
    warnings: warnings.slice(0, 5) // Limit warnings
  };
}

/**
 * Resolve full dependency chain recursively
 */
function resolveDependencyChain(db, componentNames, visited = new Set()) {
  const chain = [];

  componentNames.forEach(name => {
    if (visited.has(name)) return;
    visited.add(name);

    // Find component
    const component = db.prepare(`
      SELECT p.id, p.component_name
      FROM pages p
      WHERE LOWER(p.component_name) LIKE LOWER(?)
      LIMIT 1
    `).get(`%${name}%`);

    if (!component) return;

    // Get its guidance
    const guidance = db.prepare(`
      SELECT content
      FROM usage_guidance
      WHERE page_id = ?
    `).all(component.id);

    const deps = extractImplicitDependencies(guidance);

    chain.push({
      component: component.component_name,
      requires: deps.required
    });

    // Recurse
    if (deps.required.length > 0) {
      const subChain = resolveDependencyChain(db, deps.required, visited);
      chain.push(...subChain);
    }
  });

  return chain;
}

/**
 * Generate installation notes
 */
function generateInstallationNotes(dependencies, component) {
  const notes = [];

  // Always include basic ECL installation note
  notes.push('Install ECL: npm install @ecl/preset-eu or use CDN');
  notes.push('Include ECL CSS: <link rel="stylesheet" href="ecl-eu.css">');

  if (dependencies.required.ecl_styles.length > 0) {
    notes.push(`Additional stylesheets: ${dependencies.required.ecl_styles.join(', ')}`);
  }

  if (dependencies.required.ecl_scripts.length > 0) {
    notes.push(`Include ECL scripts: ${dependencies.required.ecl_scripts.join(', ')}`);
    notes.push('Initialize component with: ECL.autoInit() or new ECL.ComponentName(element)');
  } else if (component.requires_js) {
    notes.push('Include ECL JavaScript: <script src="ecl-eu.js"></script>');
    notes.push('Initialize with: ECL.autoInit()');
  }

  if (dependencies.required.other_components.length > 0) {
    notes.push(`Required components: ${dependencies.required.other_components.join(', ')}`);
  }

  if (dependencies.suggested?.commonly_paired.length > 0) {
    notes.push(`Commonly paired with: ${dependencies.suggested.commonly_paired.join(', ')}`);
  }

  if (dependencies.conflicts?.incompatible_components.length > 0) {
    notes.push(`⚠️  Avoid using with: ${dependencies.conflicts.incompatible_components.join(', ')}`);
  }

  return notes;
}

/**
 * Count total dependencies
 */
function countDependencies(dependencies) {
  let count = 0;
  count += dependencies.required.ecl_styles.length;
  count += dependencies.required.ecl_scripts.length;
  count += dependencies.required.other_components.length;
  if (dependencies.suggested) {
    count += dependencies.suggested.commonly_paired.length;
    count += dependencies.suggested.enhancement_options.length;
  }
  return count;
}
