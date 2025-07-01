// src/pages/Teams/Team.jsx
import { useState, useEffect } from 'react';
import apiClient from '../../helpers/apiClient';

const Team = () => {
  const [name, setName] = useState('');
  const [designation, setDesignation] = useState('');
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState(''); // State for search functionality

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('teams/');
        setTeamMembers(response.data);
      } catch (err) {
        console.error('Failed to fetch team members:', err);
        setError('Failed to load team members.');
      } finally {
        setLoading(false);
      }
    };
    fetchTeamMembers();
  }, []);

  const handleNameChange = (e) => {
    setName(e.target.value);
    setError(null);
    setSuccess(null);
  };

  const handleDesignationChange = (e) => {
    setDesignation(e.target.value);
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !designation.trim()) {
      setError('Name and designation cannot be empty.');
      return;
    }
    setLoading(true);
    try {
      const response = await apiClient.post('teams/', {
        name: name.trim(),
        designation: designation.trim(),
      });
      setTeamMembers([...teamMembers, response.data]);
      setName('');
      setDesignation('');
      setSuccess('Team member added successfully!');
    } catch (err) {
      console.error('Failed to add team member:', err);
      setError(err.response?.data?.name?.[0] || err.response?.data?.designation?.[0] || 'Failed to add team member.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (memberId) => {
    if (window.confirm('Are you sure you want to delete this team member?')) {
      try {
        await apiClient.delete(`teams/${memberId}/`);
        setTeamMembers(teamMembers.filter((member) => member.id !== memberId));
        setSuccess('Team member deleted successfully!');
        setError(null);
      } catch (err) {
        console.error('Error deleting team member:', err);
        setError(err.response?.data?.detail || 'Failed to delete team member.');
      }
    }
  };

  // Filter team members based on search term (name or designation)
  const filteredMembers = teamMembers.filter((member) =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.designation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="mt-4 p-4 max-w-xl mx-auto bg-gray-50 min-h-screen sm:mt-14 sm:p-6 sm:max-w-4xl">
      <h1 className="text-xl font-bold text-[#00334d] mb-4 sm:text-2xl">Team Members</h1>

      {/* Search Input */}
      <div className="mb-6">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name or designation..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00334d] text-sm"
          disabled={loading}
        />
      </div>

      {/* Add Team Member Form */}
      <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow-md mb-6 sm:p-6">
        <div className="mb-4">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={handleNameChange}
            placeholder="e.g., John Doe"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00334d] text-sm"
            disabled={loading}
          />
        </div>
        <div className="mb-4">
          <label htmlFor="designation" className="block text-sm font-medium text-gray-700 mb-2">
            Designation
          </label>
          <input
            type="text"
            id="designation"
            value={designation}
            onChange={handleDesignationChange}
            placeholder="e.g., Developer"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00334d] text-sm"
            disabled={loading}
          />
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        {success && <p className="mt-2 text-sm text-green-600">{success}</p>}
        <button
          type="submit"
          disabled={loading}
          className={`w-full px-4 py-2 text-sm font-medium text-white bg-[#00334d] rounded-md hover:bg-[#002a3f] focus:outline-none focus:ring-2 focus:ring-[#00334d] sm:w-auto ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? 'Adding...' : 'Add'}
        </button>
      </form>

      {/* Team Members List */}
      <div className="bg-white p-4 rounded-lg shadow-md sm:p-6">
        <h2 className="text-lg font-semibold text-[#00334d] mb-4 sm:text-xl">Existing Team Members</h2>
        {loading && <p className="text-sm text-gray-500">Loading...</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {filteredMembers.length === 0 ? (
          <p className="text-sm text-gray-500">No team members found.</p>
        ) : (
          <ul className="space-y-2">
            {filteredMembers.map((member) => (
              <li
                key={member.id}
                className="flex justify-between items-center text-sm text-gray-800 border-b border-gray-200 py-2"
              >
                <span>
                  {member.name} - {member.designation}
                </span>
                <button
                  onClick={() => handleDelete(member.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  disabled={loading}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Team;