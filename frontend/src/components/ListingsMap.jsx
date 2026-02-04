import { useState, useCallback, useMemo } from 'react';
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { formatPrice } from '../lib/utils';
import { Link } from 'react-router-dom';
import { Star, MapPin } from 'lucide-react';

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;

export default function ListingsMap({ listings, selectedListing, onSelectListing }) {
  const [popupInfo, setPopupInfo] = useState(null);
  const [viewState, setViewState] = useState({
    longitude: -98.5795,
    latitude: 39.8283,
    zoom: 3.5,
  });

  // Calculate bounds when listings change
  const bounds = useMemo(() => {
    if (!listings || listings.length === 0) return null;
    
    const lngs = listings.map(l => l.longitude);
    const lats = listings.map(l => l.latitude);
    
    return {
      minLng: Math.min(...lngs),
      maxLng: Math.max(...lngs),
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
    };
  }, [listings]);

  // Update view when bounds change
  useMemo(() => {
    if (bounds && listings.length > 0) {
      const centerLng = (bounds.minLng + bounds.maxLng) / 2;
      const centerLat = (bounds.minLat + bounds.maxLat) / 2;
      
      // Calculate zoom based on bounds spread
      const lngDiff = bounds.maxLng - bounds.minLng;
      const latDiff = bounds.maxLat - bounds.minLat;
      const maxDiff = Math.max(lngDiff, latDiff);
      
      let zoom = 10;
      if (maxDiff > 10) zoom = 4;
      else if (maxDiff > 5) zoom = 6;
      else if (maxDiff > 2) zoom = 8;
      else if (maxDiff > 0.5) zoom = 10;
      else zoom = 12;
      
      setViewState({
        longitude: centerLng,
        latitude: centerLat,
        zoom,
      });
    }
  }, [bounds, listings.length]);

  const handleMarkerClick = useCallback((listing) => {
    setPopupInfo(listing);
    onSelectListing?.(listing);
  }, [onSelectListing]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="w-full h-full bg-stone-100 flex items-center justify-center">
        <p className="text-stone-500">Map not available</p>
      </div>
    );
  }

  return (
    <Map
      {...viewState}
      onMove={(evt) => setViewState(evt.viewState)}
      style={{ width: '100%', height: '100%' }}
      mapStyle="mapbox://styles/mapbox/streets-v12"
      mapboxAccessToken={MAPBOX_TOKEN}
    >
      <NavigationControl position="top-left" />

      {listings.map((listing) => (
        <Marker
          key={listing.id}
          longitude={listing.longitude}
          latitude={listing.latitude}
          anchor="bottom"
          onClick={(e) => {
            e.originalEvent.stopPropagation();
            handleMarkerClick(listing);
          }}
          style={{ zIndex: selectedListing?.id === listing.id ? 10 : 1 }}
        >
          <div
            className={`
              map-marker cursor-pointer transition-all duration-200
              ${selectedListing?.id === listing.id ? 'scale-125 shadow-lg' : 'hover:scale-110'}
              ${selectedListing?.id === listing.id ? 'bg-[#E05D44] text-white border-[#E05D44]' : 'bg-white text-stone-900'}
            `}
          >
            ${Math.round(listing.price_per_day)}
          </div>
        </Marker>
      ))}

      {popupInfo && (
        <Popup
          anchor="top"
          longitude={popupInfo.longitude}
          latitude={popupInfo.latitude}
          onClose={() => setPopupInfo(null)}
          closeButton={true}
          closeOnClick={false}
          className="listing-popup"
        >
          <Link to={`/listing/${popupInfo.id}`} className="block w-64">
            <div className="aspect-video rounded-lg overflow-hidden bg-stone-100 mb-2">
              <img
                src={popupInfo.images?.[0] || 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400'}
                alt={popupInfo.title}
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="font-semibold text-stone-900 text-sm mb-1 line-clamp-1">
              {popupInfo.title}
            </h3>
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#E05D44]">
                {formatPrice(popupInfo.price_per_day)}/day
              </span>
              {popupInfo.review_count > 0 && (
                <div className="flex items-center gap-1 text-sm">
                  <Star className="h-3 w-3 fill-[#E05D44] text-[#E05D44]" />
                  <span>{popupInfo.avg_rating?.toFixed(1)}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-stone-500 mt-1">
              <MapPin className="h-3 w-3" />
              <span className="line-clamp-1">{popupInfo.location}</span>
            </div>
          </Link>
        </Popup>
      )}
    </Map>
  );
}
