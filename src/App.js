
import LoginRegister from './Components/loginregister/loginregister';
import { BrowserRouter as Router,Routes,Route } from 'react-router-dom';
 import Dashboard from './Components/Dashboard/dashboard';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginRegister/>}/>
        <Route path="/dashboard" element={<Dashboard/>}/>
      </Routes>
    </Router>
  );
}

export default App;
