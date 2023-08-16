import React from 'react';
import { BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import { Header } from './Header';
import { Top } from './Top';
import 'bootstrap/dist/css/bootstrap.min.css';
import TextView from './creative_text/pages/create_image.js';
// import TextView from './creative_text/pages/text.js';

export const App = () => {  
  return (
    <div className="container-fluid">
      <Router>
        <Header />
        <div className="mt-3">
          <Routes>
            <Route path='/' element={<Top />} />
            <Route path='/ct' element={<TextView/>}/>
            <Route path='*' element={<div className="alert alert-danger"><h4>not found...</h4></div>} />
          </Routes>
        </div>
      </Router>
    </div>
  );  
}

export default App;
