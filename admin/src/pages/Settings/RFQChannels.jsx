import { useState, useEffect } from 'react';
import apiClient from '../../helpers/apiClient';

const RFQChannels = () => {
  const [channelName, setChannelName] = useState('');
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const fetchChannels = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('rfq-channels/');
        setChannels(response.data);
      } catch (err) {
        console.error('Failed to fetch channels:', err);
        setError('Failed to load channels.');
      } finally {
        setLoading(false);
      }
    };
    fetchChannels();
  }, []);

  const handleInputChange = (e) => {
    setChannelName(e.target.value);
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!channelName.trim()) {
      setError('Channel name cannot be empty.');
      return;
    }
    setLoading(true);
    try {
      const response = await apiClient.post('rfq-channels/', {
        channel_name: channelName.trim(),
      });
      setChannels([...channels, response.data]);
      setChannelName('');
      setSuccess('Channel added successfully!');
    } catch (err) {
      console.error('Failed to add channel:', err);
      setError(err.response?.data?.channel_name?.[0] || 'Failed to add channel.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (channelId) => {
    if (window.confirm('Are you sure you want to delete this channel?')) {
      try {
        await apiClient.delete(`rfq-channels/${channelId}/`);
        setChannels(channels.filter((channel) => channel.id !== channelId));
        setSuccess('Channel deleted successfully!');
        setError(null);
      } catch (err) {
        console.error('Error deleting channel:', err);
        setError(err.response?.data?.detail || 'Failed to delete channel.');
      }
    }
  };

  return (
    <div className="mt-4 p-4 max-w-xl mx-auto bg-gray-50 min-h-screen sm:mt-14 sm:p-6 sm:max-w-4xl">
      <h1 className="text-xl font-bold text-[#00334d] mb-4 sm:text-2xl">RFQ Channels</h1>
      <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow-md mb-6 sm:p-6">
        <div className="mb-4">
          <label htmlFor="channelName" className="block text-sm font-medium text-gray-700 mb-2">
            Add Channel
          </label>
          <input
            type="text"
            id="channelName"
            value={channelName}
            onChange={handleInputChange}
            placeholder="e.g., WhatsApp, Email"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00334d] text-sm"
            disabled={loading}
          />
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          {success && <p className="mt-2 text-sm text-green-600">{success}</p>}
        </div>
        <button
          type="submit"
          disabled={loading}
          className={`w-full px-4 py-2 text-sm font-medium text-white bg-[#00334d] rounded-md hover:bg-[#002a3f] focus:outline-none focus:ring-2 focus:ring-[#00334d] sm:w-auto ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? 'Adding...' : 'Save'}
        </button>
      </form>
      <div className="bg-white p-4 rounded-lg shadow-md sm:p-6">
        <h2 className="text-lg font-semibold text-[#00334d] mb-4 sm:text-xl">Existing Channels</h2>
        {channels.length === 0 ? (
          <p className="text-sm text-gray-500">No channels found.</p>
        ) : (
          <ul className="space-y-2">
            {channels.map((channel) => (
              <li
                key={channel.id}
                className="flex justify-between items-center text-sm text-gray-800 border-b border-gray-200 py-2"
              >
                <span>{channel.channel_name}</span>
                <button
                  onClick={() => handleDelete(channel.id)}
                  className="bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600"
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

export default RFQChannels;