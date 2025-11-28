import React, { useState, useEffect, useCallback } from "react";
import ModalWrapper from "./ModalWrapper";
import { Camera, X } from "lucide-react";
import { AdminAuthenticatedFetch } from "../utils/fetch-utils.js";

const apiClient = new AdminAuthenticatedFetch('/api');

const EditProfileModal = ({
  visible,
  onClose,
  userId,
  onSave,
  isDarkMode = false,
}) => {
  // -----------------------------
  // FORM STATE
  // -----------------------------
  const [form, setForm] = useState({
  firstName: "",
  lastName: "",
  email: "",
  contactNumber: "",
  dob: "",
  address: "",
  parentEmail: "",
  parentIbId: "",
  parentIbError: "",
  createdBy: "",
  profileImage: null,
});

const [originalForm, setOriginalForm] = useState(null); // To restore on cancel

  const [imagePreview, setImagePreview] = useState(null);

  const [loadingParent, setLoadingParent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true); // Loading state for initial data fetch

  const [editMode, setEditMode] = useState(false); // VIEW → EDIT toggle

  // ===========================================================
  // FETCH USER DETAILS
  // ===========================================================
  const fetchUserDetails = useCallback(async () => {
    if (!userId) return;

    setLoading(true);

    try {
      const data = await apiClient.get(`/user/${userId}/`);

      // MAP API → FORM
      const mapped = {
        firstName: data.first_name || "",
        lastName: data.last_name || "",
        email: data.email || "",
        contactNumber: data.phone_number || "",
        dob: data.dob || "",
        address: data.address || "",
        createdBy: data.created_by_email || "",
        parentEmail: data.parent_ib_email || "",
        // backend uses two keys but both same
        profileImage: data.profile_pic || data.profile_image_url || null,
      };

      setForm(mapped);
      setImagePreview(mapped.profileImage);
      setOriginalForm(mapped); // store original (READONLY)
      setEditMode(false); // ensure default is readonly mode

    } catch (err) {
      console.error("User load error:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (visible) fetchUserDetails();
  }, [visible, fetchUserDetails]);

  useEffect(() => {
    if (!userId) return;

    fetchUserDetails();
  }, [userId, fetchUserDetails]);

  // ===========================================================
  // GET PARENT IB (AFTER EMAIL)
  // ===========================================================
  const fetchParentIb = async (email) => {
    if (!email) {
      setForm((prev) => ({
        ...prev,
        parentIbId: "",
        parentIbError: "",
      }));
      return;
    }

    setLoadingParent(true);

    try {
      const data = await apiClient.get(`/admin/find-user-by-email/?email=${encodeURIComponent(email)}`, { email });

      if (data?.email !== email) {
        setForm((prev) => ({
          ...prev,
          parentIbId: "",
          parentIbError: "User not found for this email.",
        }));
      } else {
        setForm((prev) => ({
          ...prev,
          parentIbId: data?.user_id || "",
          parentIbError: "",
        }));
      }
    } catch (err) {
      console.error("Error fetching parent IB:", err);
      setForm((prev) => ({
        ...prev,
        parentIbId: "",
        parentIbError: "User not found for this email.",
      }));
    }

    setLoadingParent(false);
  };

  const handleParentEmailBlur = () => {
    fetchParentIb(form.parentEmail);
  };

  // ===========================================================
  // PATCH UPDATE REQUEST
  // ===========================================================
  const submitPatchUpdate = async () => {
    if (!userId) return alert("User ID missing");

    setSaving(true);

    try {
      const formData = new FormData();

      // TEXT FIELDS
      formData.append("first_name", form.firstName);
      formData.append("last_name", form.lastName);
      formData.append("email", form.email);
      formData.append("phone_number", form.contactNumber);
      formData.append("dob", form.dob);
      formData.append("address", form.address);

      formData.append("created_by_email", form.createdBy);
      formData.append("parent_ib_email", form.parentEmail);

      if (form.parentIbId) {
        formData.append("parent_ib", form.parentIbId);
      }

      // PROFILE IMAGE FIELD NAME FIXED
      if (form.profileImage instanceof File) {
        formData.append("profile_pic", form.profileImage);
      }

      const updated = await apiClient.patch(`/user/${userId}/`, formData);

      if (onSave) onSave(updated);

      setSaving(false);
      setEditMode(false);
      onClose();
    } catch (err) {
      console.error("PATCH error:", err);
      alert("Failed to update profile.");
      setSaving(false);
    }
  };



  const handleSave = async (e) => {
    e.preventDefault();

    await fetchParentIb(form.parentEmail); // FIRST

    // Check if there's an error with parent IB
    if (form.parentIbError) {
      alert("Please fix the Parent IB Email error before saving.");
      return;
    }

    await submitPatchUpdate();             // THEN update
  };

  // ===========================================================
  // IMAGE
  // ===========================================================
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

  const handleChange = (field) => (e) =>
    setForm({ ...form, [field]: e.target.value });

  const handleParentEmailChange = (e) => {
    setForm({ ...form, parentEmail: e.target.value, parentIbId: "", parentIbError: "" });
  };

  // ===========================================================
  // UI STYLES + BUTTONS
  // ===========================================================
  const inputBg = isDarkMode
    ? "bg-gray-800 text-yellow-200 border border-yellow-600 placeholder-yellow-500"
    : "bg-gray-50 text-black border border-gray-300 placeholder-gray-500";

  const labelColor = isDarkMode ? "text-yellow-300" : "text-gray-700";

  const footer = (
    <div className="flex justify-end gap-3">
      {!editMode ? (
        <>
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-300 px-4 py-2 rounded"
          >
            Close
          </button>

          <button
            type="button"
            onClick={() => setEditMode(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Edit
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setEditMode(false)}
            className="bg-gray-400 px-4 py-2 rounded"
          >
            Cancel
          </button>

          <button
            type="submit"
            onClick={handleSave}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </>
      )}
    </div>
  );

  // ===========================================================
  // UI
  // ===========================================================
  return (
    <ModalWrapper
      title="Edit Profile"
      visible={visible}
      onClose={onClose}
      footer={footer}
    >
      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <form className="space-y-6" onSubmit={handleSave}>
          {/* IMAGE */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="profile"
                  className="w-32 h-32 rounded-full object-cover border-4 border-yellow-500"
                />
              ) : (
                <div className="w-32 h-32 rounded-full flex items-center justify-center border-4 border-dashed border-gray-400">
                  <Camera size={40} />
                </div>
              )}

              {editMode && (
                <label className="absolute bottom-0 right-0 bg-yellow-500 p-2 rounded-full cursor-pointer">
                  <Camera size={18} />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {imagePreview && editMode && (
              <button
                type="button"
                className="text-red-500 text-sm"
                onClick={handleRemoveImage}
              >
                <X size={14} /> Remove
              </button>
            )}
          </div>

          {/* FORM */}
          <div className="grid grid-cols-1 gap-4">
            {/* Name */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelColor}>First Name</label>
                <input
                  disabled={!editMode}
                  value={form.firstName}
                  onChange={handleChange("firstName")}
                  className={`w-full rounded px-3 py-2 ${inputBg}`}
                />
              </div>

              <div>
                <label className={labelColor}>Last Name</label>
                <input
                  disabled={!editMode}
                  value={form.lastName}
                  onChange={handleChange("lastName")}
                  className={`w-full rounded px-3 py-2 ${inputBg}`}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className={labelColor}>Email</label>
              <input
                disabled={!editMode}
                value={form.email}
                onChange={handleChange("email")}
                className={`w-full rounded px-3 py-2 ${inputBg}`}
              />
            </div>

            {/* Phone + DOB */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelColor}>Contact Number</label>
                <input
                  disabled={!editMode}
                  value={form.contactNumber}
                  onChange={handleChange("contactNumber")}
                  className={`w-full rounded px-3 py-2 ${inputBg}`}
                />
              </div>

              <div>
                <label className={labelColor}>DOB</label>
                <input
                  type="date"
                  disabled={!editMode}
                  value={form.dob}
                  onChange={handleChange("dob")}
                  className={`w-full rounded px-3 py-2 ${inputBg}`}
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className={labelColor}>Address</label>
              <input
                disabled={!editMode}
                value={form.address}
                onChange={handleChange("address")}
                className={`w-full rounded px-3 py-2 ${inputBg}`}
              />
            </div>

            {/* CreatedBy + Parent Email */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelColor}>Created By</label>
                <input
                  disabled={!editMode}
                  value={form.createdBy}
                  onChange={handleChange("createdBy")}
                  className={`w-full rounded px-3 py-2 ${inputBg}`}
                />
              </div>

              <div>
                <label className={labelColor}>Parent IB Email</label>
                <input
                  disabled={!editMode}
                  value={form.parentEmail}
                  onChange={handleParentEmailChange}
                  onBlur={handleParentEmailBlur}
                  className={`w-full rounded px-3 py-2 ${inputBg}`}
                />

                {loadingParent && (
                  <p className="text-xs text-blue-500">Checking...</p>
                )}

                {form.parentIbError && (
                  <p className="text-xs text-red-500">{form.parentIbError}</p>
                )}
              </div>
            </div>
          </div>
        </form>
      )}
    </ModalWrapper>
  );
};

export default EditProfileModal;
