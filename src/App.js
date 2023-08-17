import React, { useState, useRef, useEffect, useCallback} from 'react';
import { GoogleMap, Marker, InfoWindow, LoadScript } from '@react-google-maps/api';
import axios from 'axios';

function MyMapComponent() {
  const mapRef = useRef(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [resMarkers, setResMarkers] = useState([]);
  const [searchButtonVisible, setSearchButtonVisible] = useState(false);
  const [center, setCenter] = useState({
    lat: 35.681263,
    lng: 139.767937
  });
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [iframeUrl, setIframeUrl] = useState(null);
  const [taskID, setTaskID] = useState(null);
  const [taskState, setTaskState] = useState(null);
  const csrfToken = getCookie('csrftoken');

  function getCookie(name) {
    // console.log('All cookies:', document.cookie);
    // console.log('Looking for cookie with name:', name);
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === (name + '=')) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }

  const onMapLoad = useCallback((map) => {
    setCenter(map.getCenter().toJSON());
    mapRef.current = map;
  }, []);

  const createCustomMarkerIcon = (color, size) => {
    return {
      path: window.google.maps.SymbolPath.CIRCLE,
      fillColor: color,
      fillOpacity: 1,
      strokeColor: color,
      strokeWeight: 0,
      scale: size // 大きさを設定
    };
  };

  const containerStyle = {
    width: '100%',
    height: '320px'
  };

  const onClickHandler = (event) => {
    const location = event.latLng.toJSON();
    setSearchButtonVisible(false);
    // setSelectedMarker(null);
    setSelectedLocation(location);
    setSearchButtonVisible(false); 
  };
  // 地図上のマーカー
  const markerClickHandler = () => {
    // setSelectedMarker(null);
    setSearchButtonVisible(true); // マーカーをクリックした際にボタンを表示する
  };
  // レストランのマーカー
  const onMarkerClick = (marker) => {
    setSearchButtonVisible(false);
    setSelectedMarker(marker);
  };

  const displayURL = (marker) => {
    setIframeUrl(marker.url);
  }

  const searchButtonClickHandler = () => {
    startTask(selectedLocation);
    // setSearchButtonVisible(false);
  };

// -------------
  const startTask = async (location) => {
    console.log(csrfToken);
    try {
      const response = await axios.post('http://127.0.0.1:8000/ct/api/create_image/', {
        latitude: location.lat,
        longitude: location.lng,
      }, {
        headers: {
          'X-CSRFToken': csrfToken
        }
      });
      console.log("task_started");
      setTaskID(response.data.task_id);
      setTaskState(null);
    } catch (error) {
      console.error(error);
    }
  };

  const pollTaskState = useCallback(async () => {
    console.log(taskID);
    if (taskID === null) {
        return;
    }
  
    try {
        const response = await axios.post(
          'http://127.0.0.1:8000/ct/api/check_state/',
          { task_id: taskID },
          {
            // ヘッダーにCSRFトークンを設定
            headers: {
              'X-CSRFToken': csrfToken
            }
          }
        );
        var data = response.data;
        console.log(data);
        setTaskState(data.state);
        if (data.state === 'READY') {
          const result = JSON.parse(data.result);
          setResMarkers(result);
        } else {
            setTaskState(taskState + " ");
        }
    } catch (error) {
        console.error(error);
    }
  }, [taskID, csrfToken, taskState]);
  

  useEffect(() => {
      if (taskID !== null && taskState !== 'READY') {
          const timer = setTimeout(pollTaskState, 3000);
          return () => clearTimeout(timer);
      } 
  }, [taskID, taskState, pollTaskState]);


  // ---------

  return (
    <div>
      <LoadScript
        googleMapsApiKey={process.env.REACT_APP_GM_API}
      >
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={center} // 初期値としてのみ使用
            zoom={15}
            onClick={onClickHandler}
            onLoad={onMapLoad} // ロード時のハンドラ
          >
            {selectedLocation && (
              <Marker position={selectedLocation} onClick={markerClickHandler} />
            )}
            {searchButtonVisible && (
              <InfoWindow position={selectedLocation} onCloseClick={() => setSearchButtonVisible(false)}>
                <button onClick={searchButtonClickHandler}>周辺のレストランを検索する</button>
              </InfoWindow>
            )}
            {resMarkers.map((marker, index) => (
              <Marker
                key={index}
                position={{ lat: marker.lat, lng: marker.lng }}
                icon={createCustomMarkerIcon('blue', 10)}
                onClick={() => onMarkerClick(marker)} // クリックハンドラを追加
              />
            ))}
            {selectedMarker && (
              <InfoWindow
                position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
                onCloseClick={() => setSelectedMarker(null)} // 閉じるボタンをクリックした際の処理
              >
                <div>
                  <h4>{selectedMarker.name}</h4> 
                  <button onClick={() => displayURL(selectedMarker)}>サイトを表示</button>
                  <h4>別タブで開く</h4>
                  {/* リンクにしたい場合はこっちを採用 */}
                  <a href={selectedMarker.url} target="_blank" rel="noopener noreferrer">
                    HOT PEPPERサイトへ
                  </a>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
      </LoadScript>
      {iframeUrl && <iframe src={iframeUrl} width="100%" height="500px" title="your selected restaurant" />}
    </div>
  );
}

export default MyMapComponent;
