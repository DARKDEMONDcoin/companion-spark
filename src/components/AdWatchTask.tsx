import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/hooks/use-toast";
import { showAd } from "@/lib/telegram-ads";
import {
  AD_TASK_GOAL,
  AD_TASK_REWARD,
  claimAdRewardForTelegram,
  getAdProgressForTelegram,
  incrementAdWatchForTelegram,
} from "@/lib/game-api";

const AdWatchTask = () => {
  const { user, setUser } = useApp();
  const { toast } = useToast();
  const [watched, setWatched] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const res = await getAdProgressForTelegram(user.telegramUser.id);
        if (active) setWatched(res?.adsWatched ?? 0);
      } catch {
        // keep zero on failure
      }
    })();
    return () => {
      active = false;
    };
  }, [user.telegramUser.id, user.profileId]);

  const ready = watched >= AD_TASK_GOAL;
  const progress = Math.min((watched / AD_TASK_GOAL) * 100, 100);

  const handleWatch = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const shown = await showAd();
      if (!shown) {
        toast({ title: "No ad available", description: "Try again in a moment", variant: "destructive" });
        return;
      }
      const res = await incrementAdWatchForTelegram(user.telegramUser.id);
      if (res?.success) setWatched(res.adsWatched);
    } catch {
      toast({ title: "Ad failed", description: "Please try again", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const handleClaim = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await claimAdRewardForTelegram(user.telegramUser.id);
      if (!res?.success) {
        toast({
          title: "Not yet!",
          description: `Watch ${AD_TASK_GOAL} ads first (current: ${res?.adsWatched ?? watched})`,
          variant: "destructive",
        });
        return;
      }
      setWatched(res.adsWatched ?? 0);
      if (res.balances) {
        setUser((prev) => ({
          ...prev,
          siriBalance: res.balances!.siri,
          tonBalance: res.balances!.ton,
          usdtBalance: res.balances!.usdt,
        }));
      }
      toast({ title: "Reward Claimed!", description: `+${AD_TASK_REWARD} Gram` });
    } catch {
      toast({ title: "Claim failed", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div
      layout
      className="relative rounded-2xl glass glass-panel border border-primary/30 mb-2.5"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="absolute -top-2 right-3 bg-accent text-accent-foreground text-[9px] font-display font-bold px-2 py-0.5 rounded-full shadow-lg">
        PINNED
      </div>
      <div className="rounded-2xl p-3.5">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Watch {AD_TASK_GOAL} ads</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {watched}/{AD_TASK_GOAL} watched
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-base font-display font-bold text-primary leading-none">+{AD_TASK_REWARD}</p>
            <p className="text-[10px] text-muted-foreground tracking-wider mt-1">Gram</p>
          </div>
        </div>

        <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={() => void (ready ? handleClaim() : handleWatch())}
          className="mt-3 w-full rounded-full h-10 font-display text-xs uppercase tracking-widest bg-primary text-primary-foreground disabled:opacity-60 active:scale-[0.98] transition-all"
        >
          {busy ? "Loading..." : ready ? `Claim ${AD_TASK_REWARD} Gram` : "Watch Ad"}
        </button>
      </div>
    </motion.div>
  );
};

export default AdWatchTask;
