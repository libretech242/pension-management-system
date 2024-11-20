const { Sequelize } = require('sequelize');
const { logger } = require('../utils/logger');
const config = require('../config/database');

let sequelize;

describe('Database Operations', () => {
    beforeAll(async () => {
        try {
            sequelize = new Sequelize(config.test);
            await sequelize.authenticate();
            logger.info('Database connection established for tests');
            await sequelize.sync({ force: true });
        } catch (error) {
            logger.error('Unable to connect to database:', error);
            throw error;
        }
    });

    afterAll(async () => {
        if (sequelize) {
            await sequelize.close();
        }
    });

    describe('Employee Model Operations', () => {
        const { Employee } = require('../models');

        it('Create employee - should succeed', async () => {
            const employee = await Employee.create({
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com',
                dateOfBirth: '1990-01-01',
                employeeId: 'EMP001',
                department: 'IT',
                position: 'Developer',
                salary: 75000,
                hireDate: '2020-01-01'
            });

            expect(employee).toBeTruthy();
            expect(employee.firstName).toBe('John');
            expect(employee.email).toBe('john.doe@example.com');
        });

        it('Read employee - should return correct data', async () => {
            const employee = await Employee.findOne({
                where: { email: 'john.doe@example.com' }
            });

            expect(employee).toBeTruthy();
            expect(employee.firstName).toBe('John');
            expect(employee.lastName).toBe('Doe');
        });

        it('Update employee - should modify data', async () => {
            const [updated] = await Employee.update(
                { salary: 80000 },
                { where: { email: 'john.doe@example.com' } }
            );

            expect(updated).toBe(1);

            const employee = await Employee.findOne({
                where: { email: 'john.doe@example.com' }
            });
            expect(employee.salary).toBe(80000);
        });

        it('Delete employee - should remove record', async () => {
            const deleted = await Employee.destroy({
                where: { email: 'john.doe@example.com' }
            });

            expect(deleted).toBe(1);

            const employee = await Employee.findOne({
                where: { email: 'john.doe@example.com' }
            });
            expect(employee).toBeNull();
        });
    });

    describe('Database Error Handling', () => {
        const { Employee } = require('../models');

        it('Duplicate email - should fail', async () => {
            await Employee.create({
                firstName: 'John',
                lastName: 'Doe',
                email: 'test@example.com',
                dateOfBirth: '1990-01-01',
                employeeId: 'EMP001',
                department: 'IT',
                position: 'Developer',
                salary: 75000,
                hireDate: '2020-01-01'
            });

            await expect(
                Employee.create({
                    firstName: 'Jane',
                    lastName: 'Doe',
                    email: 'test@example.com',
                    dateOfBirth: '1991-01-01',
                    employeeId: 'EMP002',
                    department: 'HR',
                    position: 'Manager',
                    salary: 85000,
                    hireDate: '2020-02-01'
                })
            ).rejects.toThrow();
        });

        it('Invalid data - should fail validation', async () => {
            await expect(
                Employee.create({
                    firstName: '',
                    lastName: '',
                    email: 'invalid-email',
                    dateOfBirth: 'invalid-date',
                    employeeId: '',
                    department: '',
                    position: '',
                    salary: 'invalid-salary',
                    hireDate: 'invalid-date'
                })
            ).rejects.toThrow();
        });
    });
});
