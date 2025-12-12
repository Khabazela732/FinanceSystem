import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

function SignUp() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    fullname: "",
    lastname: "",
    company: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!form.username ||!form.fullname ||!form.lastname ||!form.company ||!form.email ||!form.password) {
      setError("All fields are required");
      return;
    }

    try {
      const response = await fetch("http://localhost:3001/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username,fullname: form.fullname,lastname: form.lastname,company: form.company,email: form.email,
          password: form.password,}),
      });

      if (response.ok) {
        alert("Account created successfully!");
        navigate("/login");
      } else {
        const data = await response.json();
        setError(data.message || "Signup failed");
      }
    } catch (err) {
      setError("Network error or server unavailable");
    }
  };

  return (
    <div className="signup-container">
      <form className="signup-form" onSubmit={handleSubmit} noValidate>
        <h2>Create Your Profile</h2>
        {error && <p className="error">{error}</p>}

        <input
          name="username"
          type="text"
          placeholder="Username"
          value={form.username}
          onChange={handleChange}
          required
        />
        <input
          name="fullname"
          type="text"
          placeholder="Full Name"
          value={form.fullname}
          onChange={handleChange}
          required
        />
        <input
          name="lastname"
          type="text"
          placeholder="Last Name"
          value={form.lastname}
          onChange={handleChange}
          required
        />
        <input
          name="company"
          type="text"
          placeholder="Company Name"
          value={form.company}
          onChange={handleChange}
          required
        />
        <input
          name="email"
          type="email"
          placeholder="Email Address"
          value={form.email}
          onChange={handleChange}
          required
        />
        <input
          name="password"
          type="password"
          placeholder="Create Your Password"
          value={form.password}
          onChange={handleChange}
          required
        />
        <input
          name="confirmPassword"
          type="password"
          placeholder="Re-Enter Your Password"
          value={form.confirmPassword}
          onChange={handleChange}
          required
        />
        <button type="submit" className="App-link">
          Sign Up
        </button>
      </form>
    </div>
  );
}

export default SignUp;
