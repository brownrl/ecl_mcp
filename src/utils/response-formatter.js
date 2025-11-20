/**
 * Response Formatter for ECL MCP Server
 * 
 * Ensures all tools return consistent response format
 */

/**
 * Format successful response
 * @param {*} data - Response data
 * @param {object} metadata - Tool metadata
 * @param {object} options - Additional options (suggestions, warnings)
 */
export function formatSuccess(data, metadata = {}, options = {}) {
  return {
    success: true,
    data,
    metadata: {
      source: 'ecl-database',
      version: '2.0',
      cache_hit: false,
      ...metadata
    },
    ...(options.suggestions && { suggestions: options.suggestions }),
    ...(options.warnings && { warnings: options.warnings })
  };
}

/**
 * Format error response
 * @param {Error|Error[]} errors - Error(s) that occurred
 * @param {object} metadata - Tool metadata
 * @param {object} options - Additional options (suggestions)
 */
export function formatError(errors, metadata = {}, options = {}) {
  const errorArray = Array.isArray(errors) ? errors : [errors];
  
  const formattedErrors = errorArray.map(err => {
    if (err.toJSON) {
      return err.toJSON();
    }
    return {
      code: err.code || 'UNKNOWN_ERROR',
      message: err.message || 'An error occurred',
      details: err.details || {}
    };
  });

  return {
    success: false,
    data: null,
    errors: formattedErrors,
    metadata: {
      source: 'ecl-database',
      version: '2.0',
      error_occurred: true,
      ...metadata
    },
    ...(options.suggestions && { suggestions: options.suggestions })
  };
}

/**
 * Format search results response
 * @param {Array} results - Search results
 * @param {object} query - Query parameters
 * @param {object} metadata - Tool metadata
 */
export function formatSearchResults(results, query = {}, metadata = {}) {
  return formatSuccess(
    {
      results,
      count: results.length,
      query
    },
    metadata,
    {
      suggestions: results.length === 0 ? [
        'Try broadening your search query',
        'Check spelling and try different keywords',
        'Use wildcards or partial matches'
      ] : undefined
    }
  );
}

/**
 * Format component response
 * @param {object} component - Component data
 * @param {object} metadata - Tool metadata
 */
export function formatComponent(component, metadata = {}) {
  if (!component) {
    return formatError(
      {
        code: 'NOT_FOUND',
        message: 'Component not found'
      },
      metadata,
      {
        suggestions: [
          'Use ecl_search_components to find available components',
          'Check spelling and try singular/plural forms'
        ]
      }
    );
  }

  return formatSuccess(component, metadata);
}

/**
 * Format design token response
 * @param {object} token - Token data
 * @param {object} metadata - Tool metadata
 */
export function formatToken(token, metadata = {}) {
  if (!token) {
    return formatError(
      {
        code: 'NOT_FOUND',
        message: 'Design token not found'
      },
      metadata,
      {
        suggestions: [
          'Use ecl_search_design_tokens to find available tokens',
          'Check token name or CSS variable'
        ]
      }
    );
  }

  return formatSuccess(token, metadata);
}

/**
 * Format validation response
 * @param {object} validationResult - Validation result with issues, recommendations, etc.
 * @param {object} metadata - Tool metadata
 */
export function formatValidation(validationResult, metadata = {}) {
  const {
    isValid,
    component,
    issues = [],
    recommendations = [],
    score = null
  } = validationResult;

  const warnings = issues
    .filter(issue => issue.severity === 'warning')
    .map(issue => issue.message);

  return formatSuccess(
    {
      valid: isValid,
      component,
      issues,
      recommendations,
      ...(score !== null && { quality_score: score })
    },
    metadata,
    {
      warnings: warnings.length > 0 ? warnings : undefined,
      suggestions: !isValid ? [
        'Review the issues list for specific problems',
        'Check ECL documentation for correct usage',
        'Use ecl_get_complete_example for a working example'
      ] : undefined
    }
  );
}

/**
 * Format generation response
 * @param {object} generatedContent - Generated HTML/code
 * @param {object} metadata - Tool metadata
 */
export function formatGeneration(generatedContent, metadata = {}) {
  return formatSuccess(
    generatedContent,
    metadata,
    {
      suggestions: [
        'Customize the generated code to fit your needs',
        'Ensure all dependencies are included',
        'Test accessibility and responsiveness'
      ]
    }
  );
}

/**
 * Format list response with pagination support
 * @param {Array} items - List items
 * @param {object} pagination - Pagination info (page, limit, total)
 * @param {object} metadata - Tool metadata
 */
export function formatList(items, pagination = null, metadata = {}) {
  const data = {
    items,
    count: items.length
  };

  if (pagination) {
    data.pagination = {
      page: pagination.page || 1,
      limit: pagination.limit || 50,
      total: pagination.total || items.length,
      has_more: pagination.has_more || false
    };
  }

  return formatSuccess(data, metadata);
}

/**
 * Format grouped results (e.g., search results grouped by category)
 * @param {object} groups - Grouped data { category: [...items] }
 * @param {object} metadata - Tool metadata
 */
export function formatGrouped(groups, metadata = {}) {
  const totalCount = Object.values(groups).reduce((sum, items) => sum + items.length, 0);
  const categories = Object.keys(groups);

  return formatSuccess(
    {
      results: groups,
      total_count: totalCount,
      categories,
      category_counts: Object.fromEntries(
        Object.entries(groups).map(([cat, items]) => [cat, items.length])
      )
    },
    metadata
  );
}

/**
 * Format graph/relationship response
 * @param {object} graph - Graph data (nodes, edges, etc.)
 * @param {object} metadata - Tool metadata
 */
export function formatGraph(graph, metadata = {}) {
  return formatSuccess(
    {
      nodes: graph.nodes || [],
      edges: graph.edges || [],
      node_count: (graph.nodes || []).length,
      edge_count: (graph.edges || []).length,
      ...(graph.format && { format: graph.format }),
      ...(graph.visualization && { visualization: graph.visualization })
    },
    metadata
  );
}

/**
 * Format analytics/statistics response
 * @param {object} stats - Statistics data
 * @param {object} metadata - Tool metadata
 */
export function formatStats(stats, metadata = {}) {
  return formatSuccess(
    {
      statistics: stats,
      generated_at: new Date().toISOString()
    },
    metadata
  );
}

/**
 * Add execution time to metadata
 * @param {number} startTime - Start time from Date.now()
 * @param {object} metadata - Existing metadata
 */
export function addExecutionTime(startTime, metadata = {}) {
  return {
    ...metadata,
    execution_time_ms: Date.now() - startTime
  };
}

/**
 * Wrap async function with consistent response formatting
 * @param {string} toolName - Name of the tool
 * @param {Function} fn - Async function to wrap
 */
export function withFormatting(toolName, fn) {
  return async function(...args) {
    const startTime = Date.now();
    
    try {
      const result = await fn(...args);
      
      // If result is already formatted with success field, just add metadata
      if (result && typeof result === 'object' && 'success' in result) {
        if (!result.metadata) {
          result.metadata = {};
        }
        result.metadata.tool = toolName;
        result.metadata.execution_time_ms = Date.now() - startTime;
        return result;
      }
      
      // Otherwise format it
      return formatSuccess(
        result,
        {
          tool: toolName,
          execution_time_ms: Date.now() - startTime
        }
      );
    } catch (error) {
      return formatError(
        error,
        {
          tool: toolName,
          execution_time_ms: Date.now() - startTime
        },
        {
          suggestions: [
            'Check the error details for more information',
            'Verify your input parameters',
            'Consult the tool documentation'
          ]
        }
      );
    }
  };
}

/**
 * Merge multiple responses (for batch operations)
 * @param {Array} responses - Array of formatted responses
 * @param {object} metadata - Overall metadata
 */
export function mergeResponses(responses, metadata = {}) {
  const allSuccessful = responses.every(r => r.success);
  const errors = responses.flatMap(r => r.errors || []);
  const data = responses.map(r => r.data);

  if (allSuccessful) {
    return formatSuccess(
      { batch_results: data },
      {
        batch_size: responses.length,
        ...metadata
      }
    );
  }

  return formatError(
    errors,
    {
      batch_size: responses.length,
      successful: responses.filter(r => r.success).length,
      failed: responses.filter(r => !r.success).length,
      ...metadata
    }
  );
}

/**
 * Format health check response
 * @param {object} health - Health check data
 * @param {object} metadata - Tool metadata
 */
export function formatHealthCheck(health, metadata = {}) {
  const status = health.status || 'unknown';
  
  return {
    success: status === 'healthy',
    data: health,
    metadata: {
      tool: 'ecl_health_check',
      timestamp: new Date().toISOString(),
      ...metadata
    },
    ...(status !== 'healthy' && {
      warnings: ['System is not fully healthy - check status details']
    })
  };
}

/**
 * Standardize existing response to new format
 * Useful for migrating old responses
 * @param {*} response - Existing response
 * @param {string} toolName - Tool name
 */
export function standardize(response, toolName) {
  // Already standardized
  if (response && typeof response === 'object' && 'success' in response) {
    if (!response.metadata) {
      response.metadata = {};
    }
    response.metadata.tool = toolName;
    return response;
  }

  // Wrap in standard format
  return formatSuccess(
    response,
    { tool: toolName }
  );
}
