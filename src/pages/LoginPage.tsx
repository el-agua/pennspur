import {useState} from 'react';

interface LoginPageProps {
  login: (username: string, password: string) => void;
  setPage: (page: string) => void;
}

const LoginPage = ({login, setPage}: LoginPageProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  return (
    <div>
      <h1>Login Page</h1>
      <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} className="border p-2 m-2"/>
      <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="border p-2 m-2"/>
      <button onClick={() => login(username, password)} className="bg-blue-500 text-white p-2 m-2 rounded hover:bg-blue-600 transition-all">Login</button>
      <p>Don't have an account? <button onClick={() => setPage('signup')} className="text-blue-500 underline">Sign Up</button></p>
    </div>
  )
}

export default LoginPage;
