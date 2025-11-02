import { PencilSquareIcon } from "@heroicons/react/24/solid";
import { Profile } from "../types/profile";
import React from "react";
import LazyImage from "./LazyImage";

interface ProfileDisplayProps {
  profile: Profile;
  onEdit: () => void;
}

const ProfileDisplay: React.FC<ProfileDisplayProps> = ({ profile, onEdit }) => {
  const defaultAvatarUrl = "/default-avatar.avif";
  const avatarUrl = profile.avatarUrl || defaultAvatarUrl;

  return (
    <div className="flex flex-col items-center">
      <div className="relative rounded-full overflow-hidden w-16 h-16 mb-2">
        <LazyImage
          dataSrc={avatarUrl}
          alt="Profile Avatar"
          className="object-cover w-full h-full"
        />
      </div>
      <h3 className="text-lg font-semibold">{profile.username}</h3>
      <div className="text-sm">
        <div className="flex items-center mb-1">
          <span className="font-semibold mr-1">Email:</span>
          <span>{profile.email}</span>
        </div>
        <div className="flex items-center mb-1">
          <span className="font-semibold mr-1">Phone:</span>
          <span>{profile.phone}</span>
        </div>
        <div className="flex items-center mb-1">
          <span className="font-semibold mr-1">Highscore:</span>
          <span>{profile.highscore}</span>
        </div>
      </div>
      <button
        onClick={onEdit}
        className="flex items-center mt-2 px-2 py-1 bg-indigo-600 text-white rounded-lg hover:bg-purple-600 transition-colors duration-300"
      >
        <PencilSquareIcon className="w-4 h-4 mr-1" />
        Edit
      </button>
    </div>
  );
};

export default ProfileDisplay;
