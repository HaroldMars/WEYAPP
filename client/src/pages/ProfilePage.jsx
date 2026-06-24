import { useState, useRef } from "react";
import { Camera, Loader2 } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import Avatar from "../components/Avatar.jsx";
import TextField from "../components/TextField.jsx";
import Button from "../components/Button.jsx";
import Banner from "../components/Banner.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { userApi } from "../api/users.js";

export default function ProfilePage() {
  const { user, updateUserLocal } = useAuth();
  const fileInputRef = useRef(null);

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    setMessage({ type: "", text: "" });
    try {
      const data = await userApi.updateAvatar(file);
      updateUserLocal(data.user);
      setMessage({ type: "success", text: "Profile picture updated." });
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ type: "", text: "" });
    try {
      const data = await userApi.updateProfile({ name, phone, bio });
      updateUserLocal(data.user);
      setMessage({ type: "success", text: "Profile updated successfully." });
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper-50">
      <PageHeader title="Profile" />

      <div className="max-w-md mx-auto px-6 py-8">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="relative">
            <Avatar name={user?.name} avatar={user?.avatar} size="xl" />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAvatar}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-signal-500 text-white
                flex items-center justify-center ring-2 ring-white hover:bg-signal-400 transition-colors"
              aria-label="Change profile picture"
            >
              {isUploadingAvatar ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Camera className="w-3.5 h-3.5" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
          <p className="text-sm text-ink-900/40">{user?.email}</p>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-4">
          {message.text && <Banner type={message.type}>{message.text}</Banner>}

          <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} required />

          <TextField
            label="Phone number"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 (555) 000-0000"
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink-900/80">About</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 200))}
              placeholder="Tell people a little about yourself..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-ink-900/10 bg-white text-ink-900
                placeholder:text-ink-900/35 outline-none focus:border-signal-500 transition-colors resize-none"
            />
            <span className="text-xs text-ink-900/35 self-end">{bio.length}/200</span>
          </div>

          <Button type="submit" isLoading={isSaving} className="mt-2">
            Save changes
          </Button>
        </form>
      </div>
    </div>
  );
}
