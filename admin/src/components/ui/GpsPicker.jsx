import React, { useState } from 'react';
import { MapPin, Navigation, ExternalLink } from 'lucide-react';

const GpsPicker = ({ value, onChange }) => {
  const [detecting, setDetecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleDetect = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser.');
      return;
    }

    setDetecting(true);
    setErrorMsg('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = parseFloat(position.coords.latitude.toFixed(6));
        const lng = parseFloat(position.coords.longitude.toFixed(6));
        const url = `https://maps.google.com/?q=${lat},${lng}`;

        onChange({
          latitude: lat,
          longitude: lng,
          locationUrl: url,
          rawText: `${lat}, ${lng}`,
        });
        setDetecting(false);
      },
      (err) => {
        setErrorMsg(err.message || 'Unable to retrieve location.');
        setDetecting(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleManualChange = (field, val) => {
    const lat = field === 'latitude' ? parseFloat(val) || null : value?.latitude;
    const lng = field === 'longitude' ? parseFloat(val) || null : value?.longitude;
    const url = lat && lng ? `https://maps.google.com/?q=${lat},${lng}` : '';

    onChange({
      ...value,
      [field]: val === '' ? null : parseFloat(val),
      locationUrl: url,
      rawText: lat && lng ? `${lat}, ${lng}` : '',
    });
  };

  const mapsUrl = value?.locationUrl || (value?.latitude && value?.longitude ? `https://maps.google.com/?q=${value.latitude},${value.longitude}` : '');

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="crm-label flex items-center gap-1.5 mb-0">
          <MapPin size={15} className="text-blue-600" />
          Installation GPS Location
        </label>
        <button
          type="button"
          onClick={handleDetect}
          disabled={detecting}
          className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 disabled:opacity-50"
        >
          <Navigation size={13} className={detecting ? 'animate-spin' : ''} />
          {detecting ? 'Acquiring GPS...' : 'Detect Device GPS'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <input
            type="number"
            step="any"
            placeholder="Latitude (e.g. 9.9312)"
            value={value?.latitude ?? ''}
            onChange={(e) => handleManualChange('latitude', e.target.value)}
            className="crm-input text-xs"
          />
        </div>
        <div>
          <input
            type="number"
            step="any"
            placeholder="Longitude (e.g. 76.2673)"
            value={value?.longitude ?? ''}
            onChange={(e) => handleManualChange('longitude', e.target.value)}
            className="crm-input text-xs"
          />
        </div>
      </div>

      {mapsUrl && (
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-slate-500">
            Coordinates: {value?.latitude}, {value?.longitude}
          </span>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium"
          >
            Open on Google Maps <ExternalLink size={12} />
          </a>
        </div>
      )}

      {errorMsg && <p className="text-xs text-red-500">{errorMsg}</p>}
    </div>
  );
};

export default GpsPicker;
