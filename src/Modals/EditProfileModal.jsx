import React, { useState, useEffect } from 'react';
import ModalWrapper from './ModalWrapper';

const EditProfileModal = ({ visible, onClose, initialData = {}, onSave }) => {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    contactNumber: '',
    dob: '',
    address: '',
    createdBy: '',
    parentEmail: '',
  });

  useEffect(() => {
    setForm({ ...form, ...initialData });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);

  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSave = (e) => {
    e.preventDefault();
    if (onSave) onSave(form);
  };

  const footer = (
    <div className="flex justify-end gap-3">
      <button onClick={handleSave} className="bg-green-500 text-white px-4 py-2 rounded">Save</button>
      <button onClick={onClose} className="bg-yellow-50 border border-yellow-400 px-4 py-2 rounded">Cancel</button>
    </div>
  );

  return (
    <ModalWrapper title="Edit Profile" visible={visible} onClose={onClose} footer={footer}>
      <form onSubmit={handleSave} className="grid grid-cols-1 gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm">First Name</label>
            <input value={form.firstName} onChange={handleChange('firstName')} className="mt-1 w-full rounded border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm">Last Name</label>
            <input value={form.lastName} onChange={handleChange('lastName')} className="mt-1 w-full rounded border px-3 py-2" />
          </div>
        </div>

        <div>
          <label className="block text-sm">Email</label>
          <input value={form.email} onChange={handleChange('email')} className="mt-1 w-full rounded border px-3 py-2" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm">Contact Number</label>
            <input value={form.contactNumber} onChange={handleChange('contactNumber')} className="mt-1 w-full rounded border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm">Date of Birth</label>
            <input type="date" value={form.dob} onChange={handleChange('dob')} className="mt-1 w-full rounded border px-3 py-2" />
          </div>
        </div>

        <div>
          <label className="block text-sm">Address</label>
          <input value={form.address} onChange={handleChange('address')} className="mt-1 w-full rounded border px-3 py-2" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm">Created By (Manager)</label>
            <input value={form.createdBy} onChange={handleChange('createdBy')} className="mt-1 w-full rounded border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm">Parent IB Email</label>
            <input value={form.parentEmail} onChange={handleChange('parentEmail')} className="mt-1 w-full rounded border px-3 py-2" />
          </div>
        </div>
      </form>
    </ModalWrapper>
  );
};

export default EditProfileModal;
