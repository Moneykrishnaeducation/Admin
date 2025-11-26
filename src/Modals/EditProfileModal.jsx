import React, { useState, useEffect } from 'react';
import ModalWrapper from './ModalWrapper';
import { Camera, X } from 'lucide-react';

const EditProfileModal = ({ visible, onClose, initialData = {}, onSave, isDarkMode = false }) => {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    contactNumber: '',
    dob: '',
    address: '',
    createdBy: '',
    parentEmail: '',
    profileImage: null,
  });
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    setForm({ ...form, ...initialData });
    if (initialData?.profileImage) {
      setImagePreview(initialData.profileImage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);

  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setForm({ ...form, profileImage: file });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setForm({ ...form, profileImage: null });
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (onSave) onSave(form);
  };

  const inputBg = isDarkMode
    ? 'bg-gray-800 text-yellow-200 border border-yellow-600 placeholder-yellow-500'
    : 'bg-gray-50 text-black border border-gray-300 placeholder-gray-500';
  const labelColor = isDarkMode ? 'text-yellow-300' : 'text-gray-700';
  const btnSave = 'bg-green-500 text-white hover:bg-green-600 px-4 py-2 rounded transition';
  const btnCancel = isDarkMode
    ? 'bg-gray-800 text-white border border-gray-700 hover:bg-gray-700 px-4 py-2 rounded transition'
    : 'bg-gray-100 text-black border border-gray-300 hover:bg-gray-200 px-4 py-2 rounded transition';

  const footer = (
    <div className="flex justify-end gap-3">
      <button type="button" onClick={onClose} className={btnCancel}>
        Cancel
      </button>
      <button type="submit" onClick={handleSave} className={btnSave}>
        Save Changes
      </button>
    </div>
  );

  return (
    <ModalWrapper 
      title="Edit Profile" 
      visible={visible} 
      onClose={onClose} 
      footer={footer}
    >
      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Image Section */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover border-4 border-yellow-500"
              />
            ) : (
              <div className={`w-32 h-32 rounded-full flex items-center justify-center border-4 border-dashed ${
                isDarkMode ? 'border-yellow-600 bg-gray-800' : 'border-gray-300 bg-gray-100'
              }`}>
                <Camera size={40} className={isDarkMode ? 'text-yellow-400' : 'text-gray-400'} />
              </div>
            )}
            <label
              htmlFor="profile-image"
              className="absolute bottom-0 right-0 bg-yellow-500 hover:bg-yellow-400 rounded-full p-2 cursor-pointer transition"
            >
              <Camera size={20} className="text-black" />
              <input
                id="profile-image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          </div>
          {imagePreview && (
            <button
              type="button"
              onClick={handleRemoveImage}
              className="text-red-500 hover:text-red-600 text-sm flex items-center gap-1"
            >
              <X size={16} /> Remove Image
            </button>
          )}
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${labelColor}`}>First Name</label>
              <input
                value={form.firstName}
                onChange={handleChange('firstName')}
                className={`w-full rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 ${inputBg}`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${labelColor}`}>Last Name</label>
              <input
                value={form.lastName}
                onChange={handleChange('lastName')}
                className={`w-full rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 ${inputBg}`}
              />
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${labelColor}`}>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={handleChange('email')}
              className={`w-full rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 ${inputBg}`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${labelColor}`}>Contact Number</label>
              <input
                value={form.contactNumber}
                onChange={handleChange('contactNumber')}
                className={`w-full rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 ${inputBg}`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${labelColor}`}>Date of Birth</label>
              <input
                type="date"
                value={form.dob}
                onChange={handleChange('dob')}
                className={`w-full rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 ${inputBg}`}
              />
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${labelColor}`}>Address</label>
            <input
              value={form.address}
              onChange={handleChange('address')}
              className={`w-full rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 ${inputBg}`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${labelColor}`}>Created By (Manager)</label>
              <input
                value={form.createdBy}
                onChange={handleChange('createdBy')}
                className={`w-full rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 ${inputBg}`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${labelColor}`}>Parent IB Email</label>
              <input
                value={form.parentEmail}
                onChange={handleChange('parentEmail')}
                className={`w-full rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 ${inputBg}`}
              />
            </div>
          </div>
        </div>
      </form>
    </ModalWrapper>
  );
};

export default EditProfileModal;
