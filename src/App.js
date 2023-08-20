import React, { useState, useRef, useEffect, useCallback} from 'react';
import { GoogleMap, Marker, InfoWindow, LoadScript } from '@react-google-maps/api';
import axios from 'axios';

function MyMapComponent() {
  const [budget, setBudget] = useState("");
  const [genre, setGenre] = useState("");
  const [range, setRange] = useState(1);
  const [otherOptions, setOtherOptions] = useState({
    飲み放題: 0,
    食べ放題: 0,
    個室: 0,
    日本酒: 0,
    ワイン: 0,
    駐車場: 0,
    カード: 0,
    ペット: 0,
  });

  const handleBudgetChange = (event) => setBudget(event.target.value);
  const handleGenreChange = (event) => setGenre(event.target.value);
  const handleRangeChange = (event) => setRange(event.target.value);
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

  const handleCheckboxChange = (event) => {
    const name = event.target.name;
    const checked = event.target.checked;
    setOtherOptions((prevOptions) => ({
      ...prevOptions,
      [name]: checked ? 1 : 0
    }));
  };

  const onMapLoad = useCallback((map) => {
    setCenter(map.getCenter().toJSON());
    mapRef.current = map;
  }, []);

  const createCustomMarkerIcon = (innercolor, outercolor, size) => {
    return {
      path: window.google.maps.SymbolPath.CIRCLE,
      fillColor: innercolor,
      fillOpacity: 1,
      strokeColor: outercolor,
      strokeWeight: 5,
      scale: size // 大きさを設定
    };
  };

  const containerStyle = {
    width: '100%',
    height: '320px'
  };

  const onClickHandler = (event) => {
    setSearchButtonVisible(false);
    setSelectedMarker(null);
    const location = event.latLng.toJSON();
    setSelectedLocation(location);
  };
  // 地図上のマーカー
  const markerClickHandler = () => {
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
    setSearchButtonVisible(false);
  };

// タスク投げ
  const startTask = async (location) => {
    console.log(csrfToken);
    console.log(otherOptions);
    try {
      const response = await axios.post('http://127.0.0.1:8000/ct/api/create_image/', {
        latitude: location.lat,
        longitude: location.lng,
        genre: genre,
        budget: budget,
        range: range,
        otheroptions: otherOptions,
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

// タスクチェック&完了処理
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
          const timer = setTimeout(pollTaskState, 1000);
          return () => clearTimeout(timer);
      } 
  }, [taskID, taskState, pollTaskState]);


  // ---------

  return (
    <div>
      <div className="filter-container">
        <label>予算:</label>
        <select value={budget} onChange={handleBudgetChange}>
          <option value="">指定なし</option>
          <option value="B009">~500円</option>
          <option value="B010">501～1000円</option>
          <option value="B011">1001～1500円</option>
          <option value="B001">1501～2000円</option>
          <option value="B002">2001～3000円</option>
          <option value="B003">3001～4000円</option>
          <option value="B003">4001～5000円</option>
          <option value="B004">5001～7000円</option>
          <option value="B005">7001～10000円</option>
          <option value="B006">10001～15000円</option>
          <option value="B012">15001～20000円</option>
          <option value="B013">20001～30000円</option>
          <option value="B014">30001円〜</option>
        </select>

        <label>ジャンル:</label>
        <select value={genre} onChange={handleGenreChange}>
          <option value="">指定なし</option>
          <option value="G001">居酒屋</option>
          <option value="G002">ダイニングバー・バル</option>
          <option value="G003">創作料理</option>
          <option value="G004">和食</option>
          <option value="G005">洋食</option>
          <option value="G006">イタリアン・フレンチ</option>
          <option value="G007">中華</option>
          <option value="G008">焼肉・ホルモン</option>
          <option value="G017">韓国料理</option>
          <option value="G009">アジア・エスニック料理</option>
          <option value="G010">各国料理</option>
          <option value="G011">カラオケ・パーティ</option>
          <option value="G012">バー・カクテル</option>
          <option value="G013">ラーメン</option>
          <option value="G016">お好み焼き・もんじゃ</option>
          <option value="G014">カフェ・スイーツ</option>
          <option value="G015">その他グルメ</option>
        </select>

        <label>検索範囲:</label>
        <select value={range} onChange={handleRangeChange}>
          <option value="1">300m</option>
          <option value="2">500m</option>
          <option value="3">1000m</option>
          <option value="4">2000m</option>
          <option value="5">3000m</option>
        </select>

      </div>

      <div className="filter-container">

      <label>その他項目:</label>
      {Object.keys(otherOptions).map((option, index) => (
        <div key={index}>
          <input
            type="checkbox"
            name={option}
            value={option}
            checked={otherOptions[option] === 1}
            onChange={handleCheckboxChange}
          />
          <label>{option}</label>
        </div>
        ))}
      </div>

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
                icon={createCustomMarkerIcon('lightgreen','green', 10)}
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
      {resMarkers.length === 0 && taskState === 'READY' && (
        <p>レストランが見つかりませんでした</p>
      )}
      {iframeUrl && <iframe src={iframeUrl} width="100%" height="500px" title="your selected restaurant" />}
    </div>
  );
}

export default MyMapComponent;
