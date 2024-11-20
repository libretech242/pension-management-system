import React from 'react';
import { Form, DatePicker, Select, Button, Space } from 'antd';
import { SearchOutlined, ClearOutlined } from '@ant-design/icons';
import moment from 'moment';

const { RangePicker } = DatePicker;
const { Option } = Select;

const PensionReportFilter = ({ onFilter, loading }) => {
  const [form] = Form.useForm();

  const handleFilter = async (values) => {
    const filters = {
      ...values,
      dateRange: values.dateRange ? {
        startDate: values.dateRange[0].format('YYYY-MM-DD'),
        endDate: values.dateRange[1].format('YYYY-MM-DD')
      } : null
    };
    onFilter(filters);
  };

  const handleReset = () => {
    form.resetFields();
    onFilter({});
  };

  return (
    <Form
      form={form}
      layout="inline"
      onFinish={handleFilter}
      className="pension-report-filter"
    >
      <Form.Item name="dateRange">
        <RangePicker
          placeholder={['Start Date', 'End Date']}
          format="YYYY-MM-DD"
          disabledDate={(current) => current && current > moment().endOf('day')}
        />
      </Form.Item>

      <Form.Item name="reportType">
        <Select
          placeholder="Report Type"
          style={{ width: 200 }}
          allowClear
        >
          <Option value="individual">Individual Report</Option>
          <Option value="department">Department Summary</Option>
          <Option value="company">Company Overview</Option>
        </Select>
      </Form.Item>

      <Form.Item>
        <Space>
          <Button
            type="primary"
            htmlType="submit"
            icon={<SearchOutlined />}
            loading={loading}
          >
            Filter
          </Button>
          <Button
            onClick={handleReset}
            icon={<ClearOutlined />}
            disabled={loading}
          >
            Reset
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default PensionReportFilter;
