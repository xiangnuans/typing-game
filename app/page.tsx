"use client";

import React, { useCallback, useEffect, useState } from "react";

import Loading from "@/components/Loading";
import { Profile } from "@/types/profile";
import ProfileDisplay from "@/components/ProfileDisplay";
import ProfileEdit from "@/components/ProfileEdit";
import TypingGame from "@/components/TypingGame";
import TodoList from "@/components/TodoList";
import axios from "axios";

const DefaultProfile = {
  id: undefined,
  avatarUrl: "",
  username: "",
  email: "",
  phone: "",
  highscore: 0,
};

const HomePage: React.FC = () => {
  const [profile, setProfile] = useState<Profile>(DefaultProfile);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const fetchProfile = useCallback(async () => {
    try {
      const response = await axios.get("/api/profile");
      setProfile(response.data);
      setIsLoading(false);
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      setIsLoading(false);
    }
  }, []);
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleEdit = () => {
    setIsEditingProfile(true);
  };

  const handleSave = async (updatedProfile: Profile) => {
    setIsLoading(true);
    try {
      await axios.post("/api/profile", updatedProfile);
      setProfile(updatedProfile);
      setIsEditingProfile(false);
    } catch (error) {
      console.error("Failed to save profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = () => {
    fetchProfile();
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-extrabold text-white mb-8 animate-fade-in-down">
        Typing Game Tool
      </h1>
      <div className="bg-white p-4 rounded-lg shadow-lg max-w-md w-full mb-4">
        {isEditingProfile ? (
          <ProfileEdit profile={profile} onSave={handleSave} />
        ) : (
          <ProfileDisplay profile={profile} onEdit={handleEdit} />
        )}
      </div>
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl w-full animate-fade mb-8">
        <TypingGame profile={profile} onRefresh={onRefresh} />
      </div>
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl w-full animate-fade">
        <TodoList />
      </div>
    </div>
  );
};

export default HomePage;
