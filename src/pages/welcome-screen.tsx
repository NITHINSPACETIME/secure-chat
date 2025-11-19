import {
  Shield,
  MessageSquare,
  Lock,
  Globe,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { motion, Variants } from "framer-motion";

type WelcomeScreenProps = {
  onCreateAccount: () => void;
  onRestoreAccount: () => void;
};

export function WelcomeScreen({
  onCreateAccount,
  onRestoreAccount,
}: WelcomeScreenProps) {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  return (
    <div className="min-h-screen w-full flex bg-background font-sans overflow-hidden">
      {/* Left Side - Hero & Brand */}
      <div className="hidden lg:flex lg:w-[55%] relative flex-col justify-between p-16 text-white overflow-hidden bg-zinc-950">
        {/* Animated Background Mesh */}
        <div className="absolute inset-0 z-0 opacity-40">
          <div
            className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-blue-600/30 rounded-full blur-[120px] animate-pulse"
            style={{ animationDuration: "8s" }}
          />
          <div
            className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-600/20 rounded-full blur-[100px] animate-pulse"
            style={{ animationDuration: "12s", animationDelay: "1s" }}
          />
          <div className="absolute top-[40%] left-[30%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[80px]" />
        </div>

        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light z-0"></div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-900/20">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">
            ProjectNyx
          </span>
        </div>

        <motion.div
          className="relative z-10 max-w-xl space-y-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h1
            variants={itemVariants}
            className="text-5xl xl:text-6xl font-extrabold leading-[1.1] tracking-tight"
          >
            Privacy is not
            <br />
            an option,
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400">
              it's a right.
            </span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-lg text-zinc-400 leading-relaxed max-w-md"
          >
            Connect globally with a decentralized protocol. No phone numbers. No
            tracking. Just you and your keys.
          </motion.p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            <motion.div
              variants={itemVariants}
              className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors"
            >
              <Lock className="w-6 h-6 text-emerald-400 mb-3" />
              <h3 className="font-semibold text-white">End-to-End Encrypted</h3>
              <p className="text-sm text-zinc-400 mt-1">
                Your messages are encrypted before they leave your device.
              </p>
            </motion.div>
            <motion.div
              variants={itemVariants}
              className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors"
            >
              <Globe className="w-6 h-6 text-blue-400 mb-3" />
              <h3 className="font-semibold text-white">Decentralized ID</h3>
              <p className="text-sm text-zinc-400 mt-1">
                No central server holds your identity. You own your data.
              </p>
            </motion.div>
          </div>
        </motion.div>

        <div className="relative z-10 flex items-center gap-6 text-xs font-medium text-zinc-500 uppercase tracking-widest">
          <span>Zero Knowledge Architecture</span>
          <div className="h-1 w-1 bg-zinc-700 rounded-full" />
          <span>Open Source</span>
        </div>
      </div>

      {/* Right Side - Actions */}
      <div className="w-full lg:w-[45%] flex flex-col items-center justify-center p-8 bg-background relative z-20">
        <div className="w-full max-w-md space-y-10">
          <div className="text-center lg:text-left space-y-2">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <h2 className="text-3xl font-bold tracking-tight text-foreground">
                Get Started
              </h2>
              <p className="text-muted-foreground">
                Create a new identity or access your existing vault.
              </p>
            </motion.div>
          </div>

          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Button
              onClick={onCreateAccount}
              className="w-full h-14 text-base font-semibold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-xl group"
              size="lg"
            >
              Create New Identity
              <ArrowRight className="w-4 h-4 ml-2 opacity-70 group-hover:translate-x-1 transition-transform" />
            </Button>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-border"></div>
              <span className="flex-shrink-0 mx-4 text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                Or
              </span>
              <div className="flex-grow border-t border-border"></div>
            </div>

            <Button
              onClick={onRestoreAccount}
              variant="outline"
              className="w-full h-14 text-base font-medium rounded-xl hover:bg-muted border-border"
              size="lg"
            >
              Restore Existing Account
            </Button>
          </motion.div>

          <motion.p
            className="text-xs text-center text-muted-foreground/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            By continuing, you acknowledge that Project Nyx cannot recover your
            password if lost.
            <br className="hidden sm:block" /> We do not store your keys.
          </motion.p>
        </div>
      </div>
    </div>
  );
}
