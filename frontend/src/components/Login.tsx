import React, { useState } from "react"
import { motion } from "framer-motion"
import { Mail, Lock, Eye, EyeOff, User, ArrowRight } from 'lucide-react'

interface LoginProps {
  onLogin?: (email: string, password: string) => void;
  onGuestLogin?: () => void;
  onSwitchToSignup?: () => void;
}

export default function Login({ onLogin, onGuestLogin, onSwitchToSignup }: LoginProps = {}) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // Simulate login process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (onLogin) {
        onLogin(email, password);
      } else {
        console.log("Login attempted with:", { email, password });
      }
    } catch (err) {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const handleGuestLogin = () => {
    if (onGuestLogin) {
      onGuestLogin();
    } else {
      console.log("Continue as guest");
    }
  }

  const handleSwitchToSignup = () => {
    if (onSwitchToSignup) {
      onSwitchToSignup();
    } else {
      console.log("Switch to signup");
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: "url(/agri-background.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="absolute inset-0 bg-black/40"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-black/30 backdrop-blur-md rounded-3xl shadow-2xl p-8 border border-white/30">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg border border-white/30"
            >
              <User className="w-8 h-8 text-white" />
            </motion.div>
            <h1
              className="text-2xl font-bold text-white mb-2 drop-shadow-lg"
              style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.8)" }}
            >
              Welcome Back
            </h1>
            <p className="text-white/90 drop-shadow" style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.8)" }}>
              Sign in to your AgriSense account
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/30 backdrop-blur-sm border border-red-300/50 text-white px-4 py-3 rounded-xl mb-6"
            >
              {error}
            </motion.div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label
                className="block text-sm font-medium text-white mb-2 drop-shadow"
                style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.8)" }}
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-white/80" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-black/20 backdrop-blur-sm border border-white/30 rounded-xl focus:ring-4 focus:ring-white/30 focus:border-white/50 outline-none transition-all text-white placeholder-white/70"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div>
              <label
                className="block text-sm font-medium text-white mb-2 drop-shadow"
                style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.8)" }}
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-white/80" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-black/20 backdrop-blur-sm border border-white/30 rounded-xl focus:ring-4 focus:ring-white/30 focus:border-white/50 outline-none transition-all text-white placeholder-white/70"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-white/80 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-green-600/90 backdrop-blur-sm hover:bg-green-700/90 text-white py-3 rounded-xl font-medium shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-green-500/50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-white/30"></div>
            <span className="text-sm text-white/90" style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.8)" }}>
              or
            </span>
            <div className="flex-1 h-px bg-white/30"></div>
          </div>

          {/* Guest Login */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGuestLogin}
            className="w-full bg-blue-600/90 backdrop-blur-sm hover:bg-blue-700/90 text-white py-3 rounded-xl font-medium shadow-lg transition-all flex items-center justify-center gap-2 border border-blue-500/50"
          >
            Continue as Guest
            <ArrowRight className="w-4 h-4" />
          </motion.button>

          {/* Switch to Signup */}
          <div className="text-center mt-6">
            <p className="text-white/90" style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.8)" }}>
              Don't have an account?{" "}
              <button
                onClick={handleSwitchToSignup}
                className="text-green-300 hover:text-green-200 font-medium transition-colors"
                style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.8)" }}
              >
                Sign up
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}