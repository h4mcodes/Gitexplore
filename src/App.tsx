import { Home } from './pages/Home';
import { Profile } from './pages/Profile';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

export default function App() {
  return <BrowserRouter><Routes><Route path="/" element={<Home />} /><Route path="/profile/:username" element={<Profile />} /></Routes></BrowserRouter>;
}
