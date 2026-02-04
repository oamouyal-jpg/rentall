import Map, { Marker, NavigationControl } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;

export default function StaticMap({ latitude, longitude, title }) {
  if (!MAPBOX_TOKEN || !latitude || !longitude) {
    return (
      <div className="w-full h-full bg-stone-100 rounded-xl flex items-center justify-center">
        <p className="text-stone-400 text-sm">Map not available</p>
      </div>
    );
  }

  return (
    <Map
      initialViewState={{
        longitude,
        latitude,
        zoom: 13,
      }}
      style={{ width: '100%', height: '100%' }}
      mapStyle="mapbox://styles/mapbox/streets-v12"
      mapboxAccessToken={MAPBOX_TOKEN}
      interactive={false}
    >
      <Marker longitude={longitude} latitude={latitude} anchor="bottom">
        <div className="w-8 h-8 bg-[#E05D44] rounded-full flex items-center justify-center shadow-lg">
          <div className="w-3 h-3 bg-white rounded-full" />
        </div>
      </Marker>
    </Map>
  );
}
