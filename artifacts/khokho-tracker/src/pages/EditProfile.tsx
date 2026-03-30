import { useState, useRef } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db, resizeImageToBase64 } from "@/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { User, Camera, Save, CheckCircle, Star } from "lucide-react";

const SKILLS = [
  "Chaser (Chasers)", "Defender (Runner)", "Sprint Specialist", "Agility Expert",
  "Stamina King", "Foul Avoider", "Tactical Thinker", "Team Leader",
  "Speed Demon", "Kho Master", "Pole Diver", "Chain Breaker",
];

export default function EditProfile() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [specialty, setSpecialty] = useState(user?.specialty || "");
  const [customSkill, setCustomSkill] = useState(
    SKILLS.includes(user?.specialty || "") ? "" : (user?.specialty || "")
  );
  const [useCustom, setUseCustom] = useState(!SKILLS.includes(user?.specialty || "") && !!user?.specialty);
  const [preview, setPreview] = useState<string>(user?.photoBase64 || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await resizeImageToBase64(file, 200);
    setPreview(base64);
  }

  async function handleSave() {
    if (!user || !name.trim()) return;
    setSaving(true);
    const finalSkill = useCustom ? customSkill : specialty;
    await updateDoc(doc(db, "users", user.uid), {
      name: name.trim(),
      specialty: finalSkill.trim(),
      ...(preview ? { photoBase64: preview } : {}),
    });
    await refreshUser();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="space-y-8 pb-10 max-w-lg mx-auto">
      <div>
        <h1 className="text-4xl font-black text-foreground flex items-center gap-3">
          <User className="text-primary" /> Edit Profile
        </h1>
        <p className="text-muted-foreground mt-2">Update your name, skill, and photo.</p>
      </div>

      {/* Profile Photo */}
      <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm flex flex-col items-center gap-5">
        <div className="relative">
          <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-primary/30 shadow-lg bg-secondary">
            {preview ? (
              <img src={preview} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-5xl font-black text-primary/40">
                  {name?.[0]?.toUpperCase() || "?"}
                </span>
              </div>
            )}
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute bottom-0 right-0 w-9 h-9 bg-primary rounded-full flex items-center justify-center shadow-lg border-2 border-background hover:bg-primary/80 transition"
          >
            <Camera className="w-4 h-4 text-white" />
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
        </div>
        <p className="text-xs text-muted-foreground">Tap the camera icon to change your photo</p>
      </div>

      {/* Name */}
      <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm space-y-3">
        <label className="text-sm font-black uppercase tracking-wider text-muted-foreground">Your Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your full name"
          className="w-full bg-secondary/50 border border-border/50 rounded-xl px-4 py-3 text-foreground font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50 text-base"
        />
      </div>

      {/* Specialty Skill */}
      <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500" />
          <label className="text-sm font-black uppercase tracking-wider text-muted-foreground">My Specialty Skill</label>
        </div>
        <p className="text-xs text-muted-foreground">Choose the skill you are best at — it shows on your profile and leaderboard.</p>

        <div className="grid grid-cols-2 gap-2">
          {SKILLS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => { setSpecialty(s); setUseCustom(false); }}
              className={`text-left px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-150 ${
                !useCustom && specialty === s
                  ? "bg-primary/15 border-primary text-primary"
                  : "bg-secondary/40 border-border/40 text-muted-foreground hover:border-primary/50"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div>
          <button
            type="button"
            onClick={() => setUseCustom(!useCustom)}
            className={`text-sm font-bold px-3 py-2 rounded-xl border transition-all ${
              useCustom ? "bg-primary/15 border-primary text-primary" : "border-dashed border-border text-muted-foreground hover:border-primary/50"
            }`}
          >
            ✏️ Write my own skill
          </button>
          {useCustom && (
            <input
              value={customSkill}
              onChange={(e) => setCustomSkill(e.target.value)}
              placeholder="e.g. Lightning Kho, Goal Scorer..."
              className="mt-2 w-full bg-secondary/50 border border-border/50 rounded-xl px-4 py-3 text-foreground font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
            />
          )}
        </div>

        {((!useCustom && specialty) || (useCustom && customSkill)) && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3 flex items-center gap-2"
          >
            <Star className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-bold text-yellow-600 dark:text-yellow-400">
              My Specialty: {useCustom ? customSkill : specialty}
            </span>
          </motion.div>
        )}
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving || !name.trim()}
        className="w-full py-4 bg-primary text-white font-black text-lg rounded-2xl flex items-center justify-center gap-3 hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
      >
        {saved ? (
          <><CheckCircle className="w-5 h-5" /> Profile Saved!</>
        ) : saving ? (
          <span className="animate-pulse">Saving...</span>
        ) : (
          <><Save className="w-5 h-5" /> Save Profile</>
        )}
      </button>
    </div>
  );
}
