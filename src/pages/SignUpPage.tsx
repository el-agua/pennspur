import {useState} from 'react'

interface SignUpPageProps {
  signup: (username: string, password: string) => void;
  setPage: (page: string) => void;
}

const SignUpPage = ({signup, setPage}: SignUpPageProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  return (
    <div>
      <h1>Sign Up Page</h1>
      <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} className="border p-2 m-2"/>
      <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="border p-2 m-2"/>
      <button className="bg-green-500 text-white p-2 m-2 rounded hover:bg-green-600 transition-all" onClick={() => signup(username, password)}>Sign Up</button>
      <p>Already have an account? <button onClick={() => setPage('login')} className="text-blue-500 underline">Login</button></p>
    </div>
  )
}

export default SignUpPage;
