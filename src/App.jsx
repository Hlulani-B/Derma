import { useState } from 'react'
import Photo from './photo'
import Home from './home.jsx'
import { Route,BrowserRouter,Routes } from 'react-router-dom'

function App() {

  return (
    <BrowserRouter>
    <Routes>
      <Route path="/"  element={<Home/>}/>
      <Route path="/photo"  element={<Photo/>}/>
      
    </Routes>
      
    </BrowserRouter>
  )
}

export default App
