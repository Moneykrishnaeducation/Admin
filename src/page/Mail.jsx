// src/components/Form.jsx
import React, { useState } from "react";

const Form = () => {
  const [formData, setFormData] = useState({
    email: "",
    subject: "",
    message: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form Submitted:", formData);
    alert("Email sent successfully!");
    setFormData({ email: "", subject: "", message: "" });
  };

  const handleSendToAll = () => {
    alert("Message sent to all users!");
  };

  return (
    <div className="bg-black p-6 sm:p-8 rounded-2xl shadow-[0px_0px_10px_rgba(255,255,255,0.2),0px_0px_15px_rgba(255,255,0,0.15)] max-w-full sm:max-w-3xl mx-auto mt-8 hover:shadow-[0px_0px_15px_rgba(255,255,255,0.35),0px_0px_20px_rgba(255,215,0,0.25)] transition-shadow duration-300">
      <h2 className="text-2xl sm:text-3xl font-bold text-yellow-400 mb-6 text-center">
        Send Email
      </h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Recipient Email */}
        <div className="flex flex-col gap-1">
          <label className="text-yellow-400 font-medium text-sm sm:text-base">Recipient Email:</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter email address separated by commas"
            className="p-3 sm:p-4 rounded-lg border border-yellow-400/30 bg-black text-yellow-400 focus:outline-none focus:border-yellow-500 text-sm sm:text-base"
            required
          />
        </div>

        {/* Subject */}
        <div className="flex flex-col gap-1">
          <label className="text-yellow-400 font-medium text-sm sm:text-base">Subject:</label>
          <input
            type="text"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            placeholder="Enter subject"
            className="p-3 sm:p-4 rounded-lg border border-yellow-400/30 bg-black text-yellow-400 focus:outline-none focus:border-yellow-500 text-sm sm:text-base"
            required
          />
        </div>

        {/* Message */}
        <div className="flex flex-col gap-1">
          <label className="text-yellow-400 font-medium text-sm sm:text-base">Message:</label>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            placeholder="Write your message"
            rows="5"
            className="p-3 sm:p-4 rounded-lg border border-yellow-400/30 bg-black text-yellow-400 focus:outline-none focus:border-yellow-500 text-sm sm:text-base"
            required
          ></textarea>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row justify-between gap-3 mt-4">
          <button
            type="submit"
            className="flex-1 bg-yellow-500 text-black py-3 rounded-full hover:bg-yellow-600 transition-all text-sm sm:text-base"
          >
            Send Email
          </button>
          <button
            type="button"
            onClick={handleSendToAll}
            className="flex-1 bg-yellow-500 text-black py-3 rounded-full hover:bg-yellow-600 transition-all text-sm sm:text-base"
          >
            Send to All Users
          </button>
        </div>
      </form>
    </div>
  );
};

export default Form;
