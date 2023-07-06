import './home.css';

function Home(props) {

  return ( 
    <div className="home-page">
      <header className="App-header">
        <p>
          Home
        </p>
        <h1>Hello {props.user.username}</h1>
        <button onClick={props.signOut}>Sign out</button>
      </header>
    </div>
  );
}

export default Home;
