const BaseModel = require('./BaseModel');
const { db } = require('../index');

class VestingRule extends BaseModel {
  constructor() {
    super('vesting_rules');
  }

  // Custom methods for vesting rule operations
  async getActiveRules() {
    return await this.db(this.tableName)
      .where({ is_active: true })
      .orderBy('years_of_service', 'asc');
  }

  async getCurrentRule(yearsOfService) {
    return await this.db(this.tableName)
      .where('years_of_service', '<=', yearsOfService)
      .andWhere({ is_active: true })
      .orderBy('years_of_service', 'desc')
      .first();
  }

  async updateRules(rules) {
    const results = {
      updated: [],
      failed: [],
      summary: { total: rules.length, successful: 0, failed: 0 }
    };

    await this.transaction(async (trx) => {
      // Deactivate all current rules
      await this.db(this.tableName)
        .update({ is_active: false })
        .transacting(trx);

      // Insert new rules
      for (const rule of rules) {
        try {
          const [result] = await this.db(this.tableName)
            .insert({
              ...rule,
              is_active: true,
              effective_from: new Date()
            })
            .returning('*')
            .transacting(trx);

          results.updated.push(result);
          results.summary.successful++;
        } catch (error) {
          results.failed.push({
            data: rule,
            error: error.message
          });
          results.summary.failed++;
        }
      }
    });

    return results;
  }

  async validateRules(rules) {
    const errors = [];

    // Sort rules by years of service
    const sortedRules = [...rules].sort((a, b) => a.years_of_service - b.years_of_service);

    // Validate each rule
    for (let i = 0; i < sortedRules.length; i++) {
      const rule = sortedRules[i];

      // Basic validation
      if (!rule.years_of_service || rule.years_of_service < 0) {
        errors.push(`Invalid years of service for rule ${i + 1}`);
      }

      if (!rule.vesting_percentage || rule.vesting_percentage < 0 || rule.vesting_percentage > 100) {
        errors.push(`Invalid vesting percentage for rule ${i + 1}`);
      }

      // Validate progression
      if (i > 0) {
        const prevRule = sortedRules[i - 1];
        if (rule.years_of_service <= prevRule.years_of_service) {
          errors.push(`Years of service must increase for each rule (rule ${i + 1})`);
        }
        if (rule.vesting_percentage <= prevRule.vesting_percentage) {
          errors.push(`Vesting percentage must increase for each rule (rule ${i + 1})`);
        }
      }
    }

    // Validate final rule reaches 100%
    const finalRule = sortedRules[sortedRules.length - 1];
    if (finalRule && finalRule.vesting_percentage !== 100) {
      errors.push('Final vesting rule must reach 100%');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Helper method to calculate vesting percentage
  async calculateVestingPercentage(yearsOfService) {
    const rule = await this.getCurrentRule(yearsOfService);
    return rule ? rule.vesting_percentage : 0;
  }
}

module.exports = new VestingRule();
