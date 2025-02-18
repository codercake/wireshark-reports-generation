import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';

const ReportContext = createContext();

export const ReportProvider = ({ children }) => {
  const [currentReport, setCurrentReport] = useState(null);
  const [reports, setReports] = useState([]);

  const fetchReports = async () => {
    try {
      const response = await axios.get('http://localhost:5002/api/reports');
      setReports(response.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  const handleDownloadReport = async (report) => {
    try {
      const response = await axios.get(`http://localhost:5002/api/reports/${report.report_path}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report_${report.report_data.timestamp}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading report:', error);
    }
  };

  return (
    <ReportContext.Provider value={{
      currentReport,
      setCurrentReport,
      reports,
      setReports,
      fetchReports,
      handleDownloadReport
    }}>
      {children}
    </ReportContext.Provider>
  );
};

export const useReportContext = () => useContext(ReportContext);
