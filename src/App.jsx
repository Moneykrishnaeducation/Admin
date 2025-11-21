import Routes from './Routers/Routes';

const App = () => {
  return (
    <div className='w-screen flex relative'>
      {/* Your existing routed content */}
      {/* Inline debug box to verify rendering independent of Tailwind */}
      <div style={{position: 'fixed', top: 10, right: 10, background: '#ff00ff', color: '#fff', padding: '6px 10px', borderRadius: 4, zIndex: 99999}}>App Renders</div>
      <Routes />
    </div>
  );
}

export default App;
