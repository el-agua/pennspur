import HomePage from './pages/HomePage';
import { useEffect, useState } from 'react';
import supabase from './services/service';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import type {User} from './types/general';

function App() {
  
  const [page, setPage] = useState('signup');
  const [user, setUser] = useState<User>({id: -1, username: ''});

  const login = async (username: string, password: string) => {
    const {data, error} = await supabase.from('users').select('*').eq('username', username).eq('password', password);
    if (data && data.length > 0) {
      sessionStorage.setItem('auth_user', username);
      sessionStorage.setItem('auth_password', password);
      setPage('home');
    } else {
      alert('Invalid username or password');
    }
    if (error) {
      alert('Error during login:' + error);
    }
  }

  const signup = async (username: string, password: string) => {
    const {data, error} = await supabase.from('users').insert([{username, password}]);
    if (!error) {
      sessionStorage.setItem('auth_user', username);
      sessionStorage.setItem('auth_password', password);
      setPage('home');
    } else {
      alert('Error during signup:' + error);
    }
  }
  
  useEffect(() => {
    const username = sessionStorage.getItem('auth_user');
    const password = sessionStorage.getItem('auth_password');
    if (!username || !password) {
      if (page === 'home') {
        setPage('login');
      }
      return;
    }
    supabase.from('users').select('*').eq('username', username).eq('password', password).then(({data, error}) => {
      if (data && data.length > 0) {
        const tempUser = data[0];
        setUser({id: tempUser.id, username: tempUser.username});
        setPage('home');
      } else {
        if (page === 'home') {
          setPage('login');
        }
      }

      if (error) {
        alert('Error during authentication:' + error);
        if (page === 'home') {
          setPage('login');
        }
      }
    }
    )
  }, [page, setPage]);

  useEffect(() => {
    if (page === 'home' && user.id === -1) { 
      setPage('signup');
    }
  }, [page, user, setPage]);
  return (
    <div>
    {
      (page === 'login') ? (
        <LoginPage login={login} setPage={setPage}/>
      ) : (page === 'signup') ? (
        <SignUpPage signup={signup} setPage={setPage}/>
      ) : (page === 'home') ? ( 
        <HomePage user={user}/>
      ) : (
        <div>Loading...</div>
      )
    }
    </div>
  );
}

export default App;
