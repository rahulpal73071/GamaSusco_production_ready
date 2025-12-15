import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { authAPI } from "../../services/api";
import bgImage from './grass.jpg';
import LOGO from './gaamasusco-logo.png';

const MAX_PASSWORD_LENGTH = 72;

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    full_name: "",
    company: "",
    role: "user",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (formData.password.length > MAX_PASSWORD_LENGTH) {
      setError(`Password cannot be longer than ${MAX_PASSWORD_LENGTH} characters.`);
      setLoading(false);
      return;
    }

    try {
      await authAPI.register(formData);
      navigate("/login");
    } catch (err) {
      console.error("Registration error:", err);
      const errorMessage =
        err.response?.data?.detail
          ? Array.isArray(err.response.data.detail)
            ? err.response.data.detail.map((e) => e.msg).join(", ")
            : err.response.data.detail
          : "Registration failed. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundImage: `url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {/* Animated overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ duration: 1.5 }}
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(135deg, rgba(0,168,107,0.5), rgba(30,136,229,0.5))",
          zIndex: 1,
        }}
      />

      {/* Card Container */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{
          position: "relative",
          zIndex: 2,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          background: "rgba(255,255,255,0.95)",
          borderRadius: "24px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          overflow: "hidden",
          maxWidth: "950px",
          width: "100%",
          minHeight: "600px",
        }}
      >
        {/* Left side panel */}
        <div
          style={{
            background: "linear-gradient(135deg, #00A86B, #1E88E5)",
            color: "white",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px",
            textAlign: "center",
          }}
        >
          <motion.h2
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{
              fontSize: "28px",
              fontWeight: "bold",
              marginBottom: "15px",
            }}
          >
            Welcome to GaamaSusco
          </motion.h2>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            style={{
              fontSize: "16px",
              lineHeight: "1.6",
              color: "rgba(255,255,255,0.9)",
            }}
          >
            Join us in building a sustainable, emission-free world.
            Track your organization’s carbon footprint and make a difference today!
          </motion.p>
          <img
            src={LOGO}
            alt="Eco Illustration"
            style={{ width: "80%", marginTop: "30px" }}
          />
        </div>

        {/* Right side form */}
        <div style={{ padding: "40px" }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{ textAlign: "center", marginBottom: "25px" }}
          >
            <h1
              style={{
                fontSize: "30px",
                fontWeight: "bold",
                background: "linear-gradient(135deg, #00A86B, #1E88E5)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Create Your Account
            </h1>
            <p style={{ color: "#666", fontSize: "15px" }}>
              Start tracking your emissions today
            </p>
          </motion.div>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                background: "#fee2e2",
                color: "#dc2626",
                padding: "12px",
                borderRadius: "8px",
                marginBottom: "20px",
                fontSize: "14px",
              }}
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit}>
              {["username", "full_name", "company", "email", "password"].map((field, idx) => (
              <motion.div
                key={field}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + idx * 0.1 }}
                style={{ marginBottom: "18px" }}
              >
                <label
                  style={{
                    display: "block",
                    marginBottom: "6px",
                    fontWeight: "600",
                    color: "#374151",
                  }}
                >
                  {field
                    .replace("_", " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                </label>
                <input
                  type={field === "password" ? "password" : "text"}
                  value={formData[field]}
                  onChange={(e) =>
                    setFormData({ ...formData, [field]: e.target.value })
                  }
                  required
                  placeholder={
                    field === "email" ? "your@email.com" :
                    field === "password" ? "Create a password" :
                    field === "username" ? "Choose a username" :
                    field === "full_name" ? "Full Name" :
                    field === "company" ? "Company / Organization" : ""
                  }
                  maxLength={field === "password" ? MAX_PASSWORD_LENGTH : undefined}
                  style={{
                    width: "100%",
                    padding: "12px 15px",
                    border: "2px solid #e5e7eb",
                    borderRadius: "10px",
                    fontSize: "15px",
                  }}
                />
              </motion.div>
            ))}

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={!loading ? { scale: 1.03, boxShadow: "0 0 15px #00A86B" } : {}}
              transition={{ duration: 0.3 }}
              style={{
                width: "100%",
                padding: "15px",
                background: loading
                  ? "#9ca3af"
                  : "linear-gradient(135deg, #00A86B, #1E88E5)",
                color: "white",
                border: "none",
                borderRadius: "10px",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </motion.button>
          </form>

          <div style={{ textAlign: "center", marginTop: "25px", display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap',  gap: '8px' }}>
            <span style={{ color: "#6b7280" }}>Already have an account? </span>
            <Link
              to="/login"
              style={{
                color: "#10b981",
                fontWeight: "600",
                textDecoration: "none",
              }}
            >
              Sign In
            </Link>

            <span style={{ color: '#6b7280' }}>or</span> 

            <Link
              to="/"
              style={{
                color: "#10b981",
                fontWeight: "600",
                textDecoration: "none",
              }}
            >
              Landing Page
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
