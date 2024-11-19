const { db } = require('../index');

class BaseModel {
  constructor(tableName) {
    this.tableName = tableName;
    this.db = db;
  }

  // Basic CRUD operations
  async findById(id) {
    return await this.db(this.tableName)
      .where({ id })
      .first();
  }

  async findOne(conditions) {
    return await this.db(this.tableName)
      .where(conditions)
      .first();
  }

  async find(conditions = {}, options = {}) {
    const query = this.db(this.tableName).where(conditions);

    if (options.select) {
      query.select(options.select);
    }

    if (options.orderBy) {
      const [column, direction] = options.orderBy.split(' ');
      query.orderBy(column, direction || 'asc');
    }

    if (options.limit) {
      query.limit(options.limit);
    }

    if (options.offset) {
      query.offset(options.offset);
    }

    return await query;
  }

  async create(data) {
    const [result] = await this.db(this.tableName)
      .insert(data)
      .returning('*');
    return result;
  }

  async update(id, data) {
    const [result] = await this.db(this.tableName)
      .where({ id })
      .update(data)
      .returning('*');
    return result;
  }

  async delete(id) {
    return await this.db(this.tableName)
      .where({ id })
      .delete();
  }

  // Transaction support
  async transaction(callback) {
    return await this.db.transaction(callback);
  }

  // Utility methods
  async count(conditions = {}) {
    const [result] = await this.db(this.tableName)
      .where(conditions)
      .count('* as count');
    return parseInt(result.count);
  }

  async exists(conditions) {
    const result = await this.db(this.tableName)
      .where(conditions)
      .first();
    return !!result;
  }
}

module.exports = BaseModel;
