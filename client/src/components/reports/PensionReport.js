import React, { useState, useEffect, useCallback } from 'react';
import { Card, message, Spin, Typography, Table, Button, Space, Dropdown } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import PensionReportFilter from './PensionReportFilter';
import PensionReportCharts from './PensionReportCharts';
import { exportReport } from '../../utils/reportExport';
import axios from 'axios';

const { Title } = Typography;

const PensionReport = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [filters, setFilters] = useState({});

  const fetchReportData = useCallback(async (filterParams) => {
    try {
      setLoading(true);
      let endpoint = '/api/pension/summary';
      
      if (filterParams.reportType === 'individual') {
        endpoint = `/api/pension/employee/${currentUser.id}/contributions`;
      }

      const params = {
        startDate: filterParams.dateRange?.startDate,
        endDate: filterParams.dateRange?.endDate
      };

      const response = await axios.get(endpoint, { params });
      setReportData(response.data.data);
    } catch (error) {
      message.error('Failed to fetch report data. Please try again later.');
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (Object.keys(filters).length > 0) {
      fetchReportData(filters);
    }
  }, [filters, fetchReportData]);

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Employee Contribution',
      dataIndex: 'employeeContribution',
      key: 'employeeContribution',
      render: (value) => `$${value.toFixed(2)}`,
    },
    {
      title: 'Employer Contribution',
      dataIndex: 'employerContribution',
      key: 'employerContribution',
      render: (value) => `$${value.toFixed(2)}`,
    },
    {
      title: 'Total',
      key: 'total',
      render: (_, record) => 
        `$${(record.employeeContribution + record.employerContribution).toFixed(2)}`,
    },
  ];

  const handleFilter = (newFilters) => {
    setFilters(newFilters);
  };

  const handleExport = async (format) => {
    try {
      if (!reportData || reportData.length === 0) {
        message.warning('No data available to export');
        return;
      }

      await exportReport(
        reportData,
        filters.reportType || 'summary',
        format,
        filters.dateRange
      );

      message.success(`Report exported successfully as ${format.toUpperCase()}`);
    } catch (error) {
      message.error(`Failed to export report: ${error.message}`);
      console.error('Export error:', error);
    }
  };

  const exportMenu = {
    items: [
      {
        key: 'excel',
        label: 'Export as Excel',
        onClick: () => handleExport('excel'),
      },
      {
        key: 'pdf',
        label: 'Export as PDF',
        onClick: () => handleExport('pdf'),
      },
    ],
  };

  return (
    <div className="pension-report">
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Title level={2}>Pension Report</Title>
          {reportData && (
            <Dropdown menu={exportMenu}>
              <Button icon={<DownloadOutlined />}>
                Export Report
              </Button>
            </Dropdown>
          )}
        </div>
        
        <PensionReportFilter onFilter={handleFilter} loading={loading} />
        
        <div style={{ marginTop: 24 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px 0' }}>
              <Spin size="large" />
            </div>
          ) : reportData ? (
            <>
              <PensionReportCharts 
                data={reportData} 
                reportType={filters.reportType}
              />
              <Card style={{ marginTop: 24 }}>
                <Table
                  dataSource={reportData}
                  columns={columns}
                  rowKey="name"
                  pagination={false}
                  scroll={{ x: true }}
                />
              </Card>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '50px 0', color: '#999' }}>
              Select filters to generate a report
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default PensionReport;
