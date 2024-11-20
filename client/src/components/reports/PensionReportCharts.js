import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Card, Row, Col, Typography } from 'antd';

const { Title } = Typography;

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const PensionReportCharts = ({ data, reportType }) => {
  if (!data || data.length === 0) {
    return null;
  }

  const renderContributionBarChart = () => (
    <Card style={{ marginBottom: 20 }}>
      <Title level={4}>Contribution Distribution</Title>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="employeeContribution" name="Employee" fill="#0088FE" />
          <Bar dataKey="employerContribution" name="Employer" fill="#00C49F" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );

  const renderDistributionPieChart = () => {
    const totalData = data.reduce((acc, item) => {
      acc.push({
        name: item.name,
        value: item.employeeContribution + item.employerContribution
      });
      return acc;
    }, []);

    return (
      <Card>
        <Title level={4}>Total Distribution by {reportType === 'department' ? 'Department' : 'Category'}</Title>
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={totalData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={150}
              fill="#8884d8"
              dataKey="value"
            >
              {totalData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </Card>
    );
  };

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} xl={12}>
        {renderContributionBarChart()}
      </Col>
      <Col xs={24} xl={12}>
        {renderDistributionPieChart()}
      </Col>
    </Row>
  );
};

export default PensionReportCharts;
