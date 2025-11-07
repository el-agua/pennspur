
interface NavButtonProps {
  setActiveTab: (arg0: string) => void;
  activeTab: string;
  id: string;
  name: string;
}

interface NavbarProps {
  setActiveTab: (arg0: string) => void;
  activeTab: string;
}

const NavButton = ({setActiveTab, activeTab, id, name} : NavButtonProps) => {
  return (
    <button 
      className={`${activeTab == id ? 'bg-blue-100' : 'bg-white'} hover:bg-blue-100 transition w-full font-display`}
      onClick={() => setActiveTab(id)}
    >
      {name}
    </button>
  )
}

const Navbar = ({setActiveTab, activeTab}: NavbarProps) => {
  return (
    <div id="navigation-buttons" className="absolute h-24 bottom-0 right-0 flex p-4 bg-white justify-between z-10 w-full">
      <NavButton setActiveTab={setActiveTab} activeTab={activeTab} id="map" name="Map" /> 
      <NavButton setActiveTab={setActiveTab} activeTab={activeTab} id="feed" name="Feed" />
      <NavButton setActiveTab={setActiveTab} activeTab={activeTab} id="settings" name="Create" />
      <NavButton setActiveTab={setActiveTab} activeTab={activeTab} id="profile" name="Profile" />
    </div>
  )
}

export default Navbar;
