import { useState, useEffect } from 'react';
import apiClient from '../../helpers/apiClient';
import { toast } from "react-toastify";

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
      toast.success("Channel added successfully!");
    } catch (err) {
      console.error('Failed to add channel:', err);
      setError(err.response?.data?.channel_name?.[0] || 'Failed to add channel.');
      toast.error(err.response?.data?.channel_name?.[0] || 'Failed to add channel.');
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
        toast.success("Channel deleted successfully!");
      } catch (err) {
        console.error('Error deleting channel:', err);
        setError(err.response?.data?.detail || 'Failed to delete channel.');
        toast.error(err.response?.data?.detail || 'Failed to delete channel.');
      }
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4 text-black">RFQ Channels</h2>
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="flex space-x-2">
          <input
            type="text"
            id="channelName"
            value={channelName}
            onChange={handleInputChange}
            placeholder="e.g., WhatsApp, Email"
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
      <div>
        {loading ? (
          <p className="text-black text-center">Loading...</p>
        ) : error && !channels.length ? (
          <p className="text-red-600 text-center">{error}</p>
        ) : (
          <ul className="list-disc pl-5">
            {channels.length === 0 ? (
              <p className="text-black text-center">No channels found.</p>
            ) : (
              channels.map((channel) => (
                <li key={channel.id} className="py-1 flex justify-between items-center text-black">
                  <span>{channel.channel_name}</span>
                  <button
                    onClick={() => handleDelete(channel.id)}
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

export default RFQChannels;