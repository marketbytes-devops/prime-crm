import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { FolderOpenDot, Clock, CheckCircle, AlertCircle, CalendarSearch, ArrowUpAZ } from 'lucide-react';
import Card from '../../../components/Card';
import Title from '../../../components/Title';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import Dropdown from '../../../components/Dropdown';
import InputField from '../../../components/InputField';

ChartJS.register(ArcElement, Tooltip, Legend);

const mockData = {
  totalProjects: 25,
  totalHoursLogged: 1250,
  completedProjects: 10,
  ongoingProjects: 12,
  dueProjects: 3,
  projectsNearingDeadline: [
    { id: 1, name: 'Website Redesign', dueDate: '2025-07-15', status: 'Overdue' },
    { id: 2, name: 'Mobile App Development', dueDate: '2025-07-20', status: 'Nearing Deadline' },
    { id: 3, name: 'API Integration', dueDate: '2025-07-18', status: 'Nearing Deadline' },
    { id: 4, name: 'Database Migration', dueDate: '2025-07-22', status: 'Nearing Deadline' },
    { id: 5, name: 'UI/UX Design', dueDate: '2025-07-25', status: 'Nearing Deadline' },
    { id: 6, name: 'Backend Optimization', dueDate: '2025-07-28', status: 'Nearing Deadline' },
    { id: 7, name: 'Security Audit', dueDate: '2025-07-30', status: 'Overdue' },
  ],
  projectStatusData: {
    labels: ['Completed', 'Ongoing', 'Due', 'Overdue'],
    datasets: [
      {
        data: [10, 12, 3, 2],
        backgroundColor: ['#34D399', '#3B82F6', '#FBBF24', '#EF4444'],
        hoverBackgroundColor: ['#2DD4BF', '#2563EB', '#F59E0B', '#DC2626'],
      },
    ],
  },
};

const ProjectDashboard = () => {
  const { widgetSettings, language } = useOutletContext();
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });
  const [sortOption, setSortOption] = useState('latestToOldest');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const itemsPerPage = 3;

  const visibleWidgets = {
    totalProjects: widgetSettings?.totalProjects ?? true,
    totalHoursLogged: widgetSettings?.totalHoursLogged ?? true,
    completedProjects: widgetSettings?.completedProjects ?? true,
    ongoingProjects: widgetSettings?.ongoingProjects ?? true,
    dueProjects: widgetSettings?.dueProjects ?? true,
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: {
            size: 12,
          },
        },
      },
    },
  };

  // Sorting and filtering logic
  const filteredProjects = mockData.projectsNearingDeadline
    .filter(project =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.dueDate.includes(searchTerm) ||
      project.status.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortOption) {
        case 'latestToOldest':
          return new Date(b.dueDate) - new Date(a.dueDate);
        case 'oldestToLatest':
          return new Date(a.dueDate) - new Date(b.dueDate);
        case 'alphaAsc':
          return a.name.localeCompare(b.name);
        case 'alphaDesc':
          return b.name.localeCompare(a.name);
        case 'costHighToLow':
          return (b.cost || 0) - (a.cost || 0);
        case 'costLowToHigh':
          return (a.cost || 0) - (b.cost || 0);
        default:
          return 0;
      }
    });

  // Pagination logic
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
  const paginatedProjects = filteredProjects.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDateRangeChange = (field, value) => {
    setDateRange((prev) => ({ ...prev, [field]: value }));
  };

  const applyDateRange = () => {
    console.log('Applied Date Range:', dateRange);
  };

  const handlePageChange = (direction) => {
    setCurrentPage(prev => {
      if (direction === 'next' && prev < totalPages) return prev + 1;
      if (direction === 'prev' && prev > 1) return prev - 1;
      return prev;
    });
  };

  const sortOptions = [
    { value: 'latestToOldest', label: 'Latest to Oldest' },
    { value: 'oldestToLatest', label: 'Oldest to Latest' },
    { value: 'alphaAsc', label: 'Alphabetic (A-Z)' },
    { value: 'alphaDesc', label: 'Alphabetic (Z-A)' },
    { value: 'costHighToLow', label: 'Project Cost (High to Low)' },
    { value: 'costLowToHigh', label: 'Project Cost (Low to High)' },
  ];

  const handleSortOptionSelect = (optionValue) => {
    setSortOption(optionValue);
  };

  return (
    <div>
      {/* Header Section */}
      <div className="w-full h-auto flex justify-between items-center">
        <Title title="Project Dashboard" />
        <div className="flex space-x-4">
          <Dropdown triggerText="Date Range" icon={CalendarSearch} onApply={applyDateRange}>
            <div className="flex items-center space-x-2 mb-2">
              <InputField
                type="date"
                value={dateRange.startDate}
                onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
                placeholder="From"
              />
              <span className="text-sm">To</span>
              <InputField
                type="date"
                value={dateRange.endDate}
                onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
                placeholder="To"
              />
            </div>
          </Dropdown>
          <Dropdown triggerText="Sort By" icon={ArrowUpAZ} onApply={() => {}}>
            <div className="space-y-2 w-[250px]">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSortOptionSelect(option.value)}
                  className={`w-full text-left px-4 py-2 text-sm rounded-lg ${
                    sortOption === option.value
                      ? 'bg-black text-white'
                      : 'text-gray-600 hover:bg-gray-200 hover:text-black'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </Dropdown>
        </div>
      </div>

      {/* Widgets Grid */}
      <div className="rounded-3xl bg-gray-50 border border-gray-200 mb-4 w-full h-auto p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {visibleWidgets.totalProjects && (
          <Card Icon={FolderOpenDot} firstData={mockData.totalProjects} secondData="Total Projects" />
        )}
        {visibleWidgets.totalHoursLogged && (
          <Card Icon={Clock} firstData={mockData.totalHoursLogged} secondData="Hours Logged" />
        )}
        {visibleWidgets.completedProjects && (
          <Card Icon={CheckCircle} firstData={mockData.completedProjects} secondData="Completed Projects" />
        )}
        {visibleWidgets.ongoingProjects && (
          <Card Icon={FolderOpenDot} firstData={mockData.ongoingProjects} secondData="Ongoing Projects" />
        )}
        {visibleWidgets.dueProjects && (
          <Card Icon={AlertCircle} firstData={mockData.dueProjects} secondData="Due Projects" />
        )}
      </div>

      <div className='grid grid-cols-1 sm:grid-cols-2 gap-6'>
        <div className="bg-white shadow-md rounded-3xl p-6">
          <h2 className="text-black text-md font-semibold mb-4">Project Status Diagram</h2>
          <div className="h-64">
            <Pie data={mockData.projectStatusData} options={chartOptions} />
          </div>
        </div>

        {/* Projects Nearing or Past Deadline Table */}
        <div className="bg-white shadow-md rounded-3xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-black text-md font-semibold">Projects Nearing or Past Deadline</h2>
            <div className="w-1/3">
              <InputField
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search projects..."
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-3 text-xs font-semibold">Sl.No</th>
                  <th className="p-3 text-xs font-semibold">Project Name</th>
                  <th className="p-3 text-xs font-semibold">Due Date</th>
                  <th className="p-3 text-xs font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProjects.length > 0 ? (
                  paginatedProjects.map((project, index) => (
                    <tr key={project.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 text-xs">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                      <td className="p-3 text-xs">{project.name}</td>
                      <td className="p-3 text-xs">{project.dueDate}</td>
                      <td className="p-3 text-xs">
                        <span
                          className={`w-3.5 rounded-full text-xs px-2 py-1 ${
                            project.status === 'Overdue'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {project.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="p-3 text-xs text-center">
                      No projects found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {filteredProjects.length > itemsPerPage && (
            <div className="flex justify-center space-x-4 items-center mt-4">
              <button
                onClick={() => handlePageChange('prev')}
                disabled={currentPage === 1}
                className={`px-4 py-2 text-sm rounded ${
                  currentPage === 1
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-black text-white hover:bg-black/80'
                }`}
              >
                Previous
              </button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange('next')}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 text-sm rounded ${
                  currentPage === totalPages
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-black text-white hover:bg-black/80'
                }`}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectDashboard;