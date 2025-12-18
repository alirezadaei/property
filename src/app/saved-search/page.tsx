"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface SavedSearch {
  id: string;
  name: string;
  q?: string;
  min_price?: number;
  max_price?: number;
  beds_min?: number;
  baths_min?: number;
  center_lat?: number;
  center_lng?: number;
  radius_km?: number;
  created_at: string;
}

export default function SavedSearchPage() {
  const router = useRouter();
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    q: "",
    min_price: "",
    max_price: "",
    beds_min: "",
    baths_min: "",
    center_lat: "",
    center_lng: "",
    radius_km: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchSavedSearches();
  }, []);

  const fetchSavedSearches = async () => {
    try {
      const response = await fetch("/api/saved-search");
      if (response.ok) {
        const data = await response.json();
        setSavedSearches(data);
      }
    } catch (error) {
      console.error("Error fetching saved searches:", error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (formData.min_price && formData.max_price) {
      const min = Number(formData.min_price);
      const max = Number(formData.max_price);
      if (min > max) {
        newErrors.min_price = "Min price must be less than max price";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const payload: any = { name: formData.name };

      if (formData.q) payload.q = formData.q;
      if (formData.min_price) payload.min_price = Number(formData.min_price);
      if (formData.max_price) payload.max_price = Number(formData.max_price);
      if (formData.beds_min) payload.beds_min = Number(formData.beds_min);
      if (formData.baths_min) payload.baths_min = Number(formData.baths_min);
      if (formData.center_lat) payload.center_lat = Number(formData.center_lat);
      if (formData.center_lng) payload.center_lng = Number(formData.center_lng);
      if (formData.radius_km) payload.radius_km = Number(formData.radius_km);

      const response = await fetch("/api/saved-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setToastMessage("Search saved successfully!");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);

        // Reset form
        setFormData({
          name: "",
          q: "",
          min_price: "",
          max_price: "",
          beds_min: "",
          baths_min: "",
          center_lat: "",
          center_lng: "",
          radius_km: "",
        });

        // Refresh list
        fetchSavedSearches();
      } else {
        const error = await response.json();
        setToastMessage(error.error || "Failed to save search");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (error) {
      console.error("Error saving search:", error);
      setToastMessage("An error occurred");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const handleApplySearch = (search: SavedSearch) => {
    const params = new URLSearchParams();
    if (search.q) params.set("q", search.q);
    if (search.min_price) params.set("min_price", search.min_price.toString());
    if (search.max_price) params.set("max_price", search.max_price.toString());
    if (search.beds_min) params.set("beds_min", search.beds_min.toString());
    if (search.baths_min) params.set("baths_min", search.baths_min.toString());

    router.push(`/?${params.toString()}`);
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Saved Searches</h1>

      {/* Toast notification */}
      {showToast && (
        <div className="fixed top-20 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in">
          {toastMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <div className="bg-white p-6 rounded-lg shadow-md h-fit">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Create New Search
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Search Name *
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="e.g., My Marina Search"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="q"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Search Query
              </label>
              <input
                id="q"
                type="text"
                value={formData.q}
                onChange={(e) =>
                  setFormData({ ...formData, q: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Marina"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="form_min_price"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Min Price (AED)
                </label>
                <input
                  id="form_min_price"
                  type="number"
                  value={formData.min_price}
                  onChange={(e) =>
                    setFormData({ ...formData, min_price: e.target.value })
                  }
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${
                    errors.min_price ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.min_price && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.min_price}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="form_max_price"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Max Price (AED)
                </label>
                <input
                  id="form_max_price"
                  type="number"
                  value={formData.max_price}
                  onChange={(e) =>
                    setFormData({ ...formData, max_price: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="form_beds_min"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Min Beds
                </label>
                <input
                  id="form_beds_min"
                  type="number"
                  value={formData.beds_min}
                  onChange={(e) =>
                    setFormData({ ...formData, beds_min: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label
                  htmlFor="form_baths_min"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Min Baths
                </label>
                <input
                  id="form_baths_min"
                  type="number"
                  value={formData.baths_min}
                  onChange={(e) =>
                    setFormData({ ...formData, baths_min: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Location Filter (Optional)
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Center Latitude
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.center_lat}
                    onChange={(e) =>
                      setFormData({ ...formData, center_lat: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="25.0"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Center Longitude
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.center_lng}
                    onChange={(e) =>
                      setFormData({ ...formData, center_lng: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="55.0"
                  />
                </div>
              </div>
              <div className="mt-3">
                <label className="block text-xs text-gray-600 mb-1">
                  Radius (km)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.radius_km}
                  onChange={(e) =>
                    setFormData({ ...formData, radius_km: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="5"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              Save Search
            </button>
          </form>
        </div>

        {/* Saved searches list */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Your Saved Searches ({savedSearches.length})
          </h2>

          {loading ? (
            <p className="text-gray-600">Loading...</p>
          ) : savedSearches.length === 0 ? (
            <p className="text-gray-600">
              No saved searches yet. Create one using the form!
            </p>
          ) : (
            <div className="space-y-3">
              {savedSearches.map((search) => (
                <div
                  key={search.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {search.name}
                  </h3>
                  <div className="text-sm text-gray-600 space-y-1 mb-3">
                    {search.q && (
                      <p>
                        <strong>Query:</strong> {search.q}
                      </p>
                    )}
                    {(search.min_price || search.max_price) && (
                      <p>
                        <strong>Price:</strong>{" "}
                        {search.min_price
                          ? `AED ${search.min_price.toLocaleString()}`
                          : "Any"}{" "}
                        -{" "}
                        {search.max_price
                          ? `AED ${search.max_price.toLocaleString()}`
                          : "Any"}
                      </p>
                    )}
                    {search.beds_min && (
                      <p>
                        <strong>Beds:</strong> {search.beds_min}+
                      </p>
                    )}
                    {search.baths_min && (
                      <p>
                        <strong>Baths:</strong> {search.baths_min}+
                      </p>
                    )}
                    {search.radius_km && (
                      <p>
                        <strong>Radius:</strong> {search.radius_km} km
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleApplySearch(search)}
                    className="w-full bg-blue-100 text-blue-700 px-3 py-2 rounded-md hover:bg-blue-200 transition-colors font-medium text-sm"
                  >
                    Apply Search
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
