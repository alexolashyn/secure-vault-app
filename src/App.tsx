import {BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom';
import {AuthProvider} from './providers/AuthProvider';
import {ProtectedRoute} from './components/ProtectedRoute';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from "./components/Dashboard.tsx";

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/login" element={<Login/>}/>
                    <Route path="/register" element={<Register/>}/>

                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <Dashboard/>
                            </ProtectedRoute>
                        }
                    />

                    <Route path="/" element={<Navigate to="/login" replace/>}/>
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;