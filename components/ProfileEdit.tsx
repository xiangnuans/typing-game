import React, { useState } from "react";

import { Profile } from "../types/profile";

interface ProfileEditProps {
  profile: Profile;
  onSave: (updatedProfile: Profile) => void;
}

const ProfileEdit: React.FC<ProfileEditProps> = ({ profile, onSave }) => {
  const [formData, setFormData] = useState(profile);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col">
        <label className="text-sm font-semibold mb-1">Username</label>
        <input
          type="text"
          name="username"
          value={formData.username}
          onChange={handleChange}
          className="p-2 border rounded-md"
          required
        />
      </div>
      <div className="flex flex-col">
        <label className="text-sm font-semibold mb-1">Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="p-2 border rounded-md"
          required
        />
      </div>
      <div className="flex flex-col">
        <label className="text-sm font-semibold mb-1">Phone</label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className="p-2 border rounded-md"
          required
        />
      </div>
      {/* <div className="flex flex-col">
        <label className="text-sm font-semibold mb-1">Avatar URL</label>
        <input
          type="url"
          name="avatarUrl"
          value={formData.avatarUrl}
          onChange={handleChange}
          className="p-2 border rounded-md"
        />
      </div> */}
      <button
        type="submit"
        className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-purple-600 transition-colors duration-300"
      >
        Save
      </button>
    </form>
  );
};

export default ProfileEdit;
