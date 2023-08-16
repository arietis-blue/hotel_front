import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import ImageCrop from './image_edit';
import DrawingCanvas from './draw_canvas';
import 'bootstrap/dist/css/bootstrap.min.css'; 

const Vt = () => {
  const [croppedImage, setCroppedImage] = useState(null);
  const [mask_Image, setMaskImage] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [taskID, setTaskID] = useState(null);
  const [taskState, setTaskState] = useState(null);
  const [taskResult, setTaskResult] = useState(null);
  function getCookie(name) {
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
  
  const csrfToken = getCookie('csrftoken');

  const handleCroppedImage = (image) => {
    setCroppedImage(image);
  };
  const handleSaveImage = (mask) => {
    setMaskImage(mask);
  };

  const startTask = async (event) => {
    event.preventDefault();
    try {
      const image = croppedImage.split(',')[1];
      const mask = mask_Image.split(',')[1];
      const response = await axios.post('http://localhost:8000/ct/api/create_image/', {
        image: image,
        mask: mask,
        prompt: prompt
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
          'http://localhost:8000/ct/api/check_state/',
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
            setTaskResult(data.result);
        } else {
            setTaskState(taskState + " ");
        }
    } catch (error) {
        console.error(error);
    }
  }, [taskID, csrfToken, taskState, setTaskResult]);
  

  useEffect(() => {
      if (taskID !== null && taskState !== 'READY') {
          const timer = setTimeout(pollTaskState, 5000);
          return () => clearTimeout(timer);
      } 
  }, [taskID, taskState, pollTaskState]);



  return (
    <div className="container mt-5">
      <div className="row">
        <div className="col-md-6">
          <ImageCrop onCropped={handleCroppedImage} />
          <DrawingCanvas backgroundImage={croppedImage} onMaskImage={handleSaveImage} />
          {mask_Image && <img src={mask_Image} alt="Mask" className="img-fluid" />}
        </div>
        <div className="col-md-6">
          <form onSubmit={startTask} className="mb-4">
            <div className="input-group">
              <input type="text" className="form-control" placeholder="Enter your prompt" value={prompt} onChange={e => setPrompt(e.target.value)} />
              <div className="input-group-append">
                <button type="submit" className="btn btn-primary">Generate Creative Text</button>
              </div>
            </div>
          </form>
          {taskID === null ? (
            <div className="alert alert-info">Please start the task by pressing the button.</div>
          ) : taskState === 'READY' ? (
            <div>
              <div className="alert alert-success">Task result: {taskResult}</div>
              <img src={`data:image/png;base64,${taskResult}`} alt="Generated Text" className="img-fluid" />
            </div>
          ) : (
            <div className="alert alert-warning">Loading...</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Vt;