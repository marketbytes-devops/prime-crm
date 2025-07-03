import { useState, useEffect } from 'react';
import apiClient from '../../helpers/apiClient';
import { toast } from "react-toastify";

const Team = () => {
  const [name, setName] = useState('');
  const [designation, setDesignation] = useState('');
  const [email, setEmail] = useState('');
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

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

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !designation.trim() || !email.trim()) {
      setError('Name, designation, and email cannot be empty.');
      toast.error('Name, designation, and email cannot be empty.');
      return;
    }
    setLoading(true);
    try {
      const response = await apiClient.post('teams/', {
        name: name.trim(),
        designation: designation.trim(),
        email: email.trim(),
      });
      setTeamMembers([...teamMembers, response.data]);
      setName('');
      setDesignation('');
      setEmail('');
      setSuccess('Team member added successfully!');
      toast.success('Team member added successfully!');
    } catch (err) {
      console.error('Failed to add team member:', err);
      const errorMessage = err.response?.data?.name?.[0] || err.response?.data?.designation?.[0] || err.response?.data?.email?.[0] || 'Failed to add team member.';
      setError(errorMessage);
      toast.error(errorMessage);
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
        toast.success('Team member deleted successfully!');
      } catch (err) {
        console.error('Error deleting team member:', err);
        const errorMessage = err.response?.data?.detail || 'Failed to delete team member.';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    }
  };

  // Filter team members based on search term (name, designation, or email)
  const filteredMembers = teamMembers.filter((member) =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4 text-black">Team Members</h2>

      {/* Search Input */}
      <div className="mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name, designation, or email..."
          className="w-full p-2 border rounded bg-transparent focus:outline-indigo-500 focus:ring focus:ring-indigo-500"
          disabled={loading}
        />
      </div>

      {/* Add Team Member Form */}
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="flex space-x-2">
          <input
            type="text"
            id="name"
            value={name}
            onChange={handleNameChange}
            placeholder="e.g., John Doe"
            className="w-full p-2 border rounded bg-transparent focus:outline-indigo-500 focus:ring focus:ring-indigo-500"
            disabled={loading}
            required
          />
          <input
            type="text"
            id="designation"
            value={designation}
            onChange={handleDesignationChange}
            placeholder="e.g., Developer"
            className="w-full p-2 border rounded bg-transparent focus:outline-indigo-500 focus:ring focus:ring-indigo-500"
            disabled={loading}
            required
          />
          <input
            type="email"
            id="email"
            value={email}
            onChange={handleEmailChange}
            placeholder="e.g., john.doe@example.com"
            className="w-full p-2 border rounded bg-transparent focus:outline-indigo-500 focus:ring focus:ring-indigo-500"
            disabled={loading}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className={`py-2 px-4 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors duration-200 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Adding...' : 'Add'}
          </button>
        </div>
        {error && <p className="text-red-600 mt-2">{error}</p>}
        {success && <p className="text-green-600 mt-2">{success}</p>}
      </form>

      {/* Team Members List */}
      <div>
        {loading ? (
          <p className="text-black text-center">Loading...</p>
        ) : error && !filteredMembers.length ? (
          <p className="text-red-600 text-center">{error}</p>
        ) : (
          <ul className="list-disc pl-5">
            {filteredMembers.length === 0 ? (
              <p className="text-black text-center">No team members found.</p>
            ) : (
              filteredMembers.map((member) => (
                <li key={member.id} className="py-1 flex justify-between items-center text-black">
                  <span>
                    {member.name} - {member.designation} ({member.email})
                  </span>
                  <button
                    onClick={() => handleDelete(member.id)}
                    className="ml-4 py-1 px-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors duration-200"
                    disabled={loading}
                  >
                    Delete
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Team;