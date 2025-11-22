import Routes from './Routers/Routes';

const App = () => {
  return (
    <div className='w-screen flex relative'>
      {/* Your existing routed content */}
      {/* Inline debug box to verify rendering independent of Tailwind */}
      
      <Routes />
    </div>
  );
}

export default App;
