import React from 'react';
import { BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import './App.css';
import Home from './pages/home';
import ManageOrder from './pages/manage-order';
import CreateCheck from './pages/create-check';
import TakeOrder from './pages/take-order';



function App() {
  return (
   <Router>
      <div className='app-background'>
        <Routes>
          <Route exact path='/' element={<Home/>}/>
          <Route path='/create-check' element={<CreateCheck/>}/>
          <Route path='/manage-order' element={<ManageOrder/>}/>
          <Route path='/take-order' element={<TakeOrder/>}/>
        </Routes>
      </div>
    </Router>
  )
}

export default App;


