/**
 * Standard API Response Format
 */
class ApiResponse {
  /**
   * Success response
   * @param {Object} data - Response data
   * @param {string} message - Success message
   * @param {number} statusCode - HTTP status code (default: 200)
   */
  static success(data = null, message = 'Success', statusCode = 200) {
    return {
      status: 'success',
      message,
      data,
      timestamp: new Date().toISOString(),
      statusCode
    };
  }

  /**
   * Error response
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code (default: 400)
   * @param {Object} errors - Detailed errors
   */
  static error(message = 'Error occurred', statusCode = 400, errors = null) {
    return {
      status: 'error',
      message,
      errors,
      timestamp: new Date().toISOString(),
      statusCode
    };
  }

  /**
   * Pagination response
   * @param {Array} data - Array of items
   * @param {number} page - Current page
   * @param {number} limit - Items per page
   * @param {number} total - Total number of items
   * @param {string} message - Success message
   */
  static paginated(data, page, limit, total, message = 'Success') {
    return {
      status: 'success',
      message,
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      timestamp: new Date().toISOString(),
      statusCode: 200
    };
  }
}

module.exports = ApiResponse;
