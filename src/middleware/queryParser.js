const ApiResponse = require('../utils/apiResponse');

/**
 * Query parser middleware for standardizing API queries
 */
const queryParser = (options = {}) => {
  const {
    maxLimit = 100,
    defaultLimit = 10,
    allowedFields = [],
    defaultSort = 'createdAt:desc'
  } = options;

  return (req, res, next) => {
    try {
      // Pagination
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(maxLimit, Math.max(1, parseInt(req.query.limit) || defaultLimit));
      const offset = (page - 1) * limit;

      // Sorting
      const sort = {};
      const sortQuery = req.query.sort || defaultSort;
      sortQuery.split(',').forEach(item => {
        const [field, order] = item.split(':');
        if (allowedFields.includes(field)) {
          sort[field] = order?.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
        }
      });

      // Filtering
      const filter = {};
      Object.keys(req.query).forEach(key => {
        if (allowedFields.includes(key) && req.query[key] !== undefined) {
          // Handle special operators
          if (typeof req.query[key] === 'string' && req.query[key].includes(':')) {
            const [operator, value] = req.query[key].split(':');
            switch (operator) {
              case 'gt':
                filter[key] = { [Op.gt]: value };
                break;
              case 'gte':
                filter[key] = { [Op.gte]: value };
                break;
              case 'lt':
                filter[key] = { [Op.lt]: value };
                break;
              case 'lte':
                filter[key] = { [Op.lte]: value };
                break;
              case 'ne':
                filter[key] = { [Op.ne]: value };
                break;
              case 'like':
                filter[key] = { [Op.like]: `%${value}%` };
                break;
              default:
                filter[key] = value;
            }
          } else {
            filter[key] = req.query[key];
          }
        }
      });

      // Search
      if (req.query.search && options.searchFields) {
        filter[Op.or] = options.searchFields.map(field => ({
          [field]: { [Op.iLike]: `%${req.query.search}%` }
        }));
      }

      // Date range
      if (req.query.startDate && req.query.endDate) {
        filter.createdAt = {
          [Op.between]: [new Date(req.query.startDate), new Date(req.query.endDate)]
        };
      }

      // Attach to request object
      req.queryOptions = {
        page,
        limit,
        offset,
        sort,
        filter
      };

      next();
    } catch (error) {
      res.status(400).json(
        ApiResponse.error('Invalid query parameters', 400, {
          details: error.message
        })
      );
    }
  };
};

module.exports = queryParser;
