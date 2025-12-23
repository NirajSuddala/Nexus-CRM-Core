import React, { useState } from 'react';

const Settings: React.FC = () => {
  const [profile, setProfile] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'Admin',
  });

  const [originalProfile, setOriginalProfile] = useState(profile);
  const [isEditing, setIsEditing] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile((prevProfile) => ({
      ...prevProfile,
      [name]: value,
    }));
  };

  const handleEdit = () => {
    setOriginalProfile(profile); // Save the current profile before editing
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!profile.name || !profile.email || !profile.role) {
      alert('All fields are mandatory.');
      return;
    }
    setIsEditing(false);
    // Add logic to save the updated profile data
    console.log('Profile saved:', profile);
  };

  const handleDiscard = () => {
    setProfile(originalProfile); // Revert to the original profile
    setIsEditing(false);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswords((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordUpdate = () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      alert('Passwords do not match.');
      return;
    }
    // Add logic to update the password
    alert('Password updated successfully.');
    setIsResettingPassword(false);
    setPasswords({ newPassword: '', confirmPassword: '' });
  };

  const handleCancelPasswordReset = () => {
    setIsResettingPassword(false);
    setPasswords({ newPassword: '', confirmPassword: '' });
  };

  const handleLogout = () => {
    // Add logic to handle logout
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={profile.name}
            onChange={handleChange}
            disabled={!isEditing}
            required
            className="mt-1 block w-1/3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="email"
            value={profile.email}
            onChange={handleChange}
            disabled={!isEditing}
            required
            className="mt-1 block w-1/3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Role <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="role"
            value={profile.role}
            disabled
            className="mt-1 block w-1/3 border border-gray-300 rounded-md shadow-sm bg-gray-100 sm:text-sm"
          />
        </div>

        <div className="flex items-center gap-4">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save
              </button>
              <button
                onClick={handleDiscard}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Discard
              </button>
            </>
          ) : (
            <button
              onClick={handleEdit}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Edit
            </button>
          )}
        </div>

        {/* Password Reset */}
        <div>
          {isResettingPassword ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  New Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwords.newPassword}
                  onChange={handlePasswordChange}
                  className="mt-1 block w-1/3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwords.confirmPassword}
                  onChange={handlePasswordChange}
                  className="mt-1 block w-1/3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={handlePasswordUpdate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Update Password
                </button>
                <button
                  onClick={handleCancelPasswordReset}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsResettingPassword(true)}
              className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
            >
              Reset Password
            </button>
          )}
        </div>

        {/* Sign out */}
        <div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;