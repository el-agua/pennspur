import HomeIcon from "@mui/icons-material/Home";
import MapIcon from "@mui/icons-material/Map";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import PersonIcon from "@mui/icons-material/Person";
import EventIcon from "@mui/icons-material/Event";
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router"; // ✅ must be react-router-dom

interface NavButtonProps {
  activeTab: string;
  id: string;
  name: string;
  icon: React.ReactNode;
  link: string;
}

const NavButton = ({ activeTab, id, name, icon, link }: NavButtonProps) => {
  const isActive = activeTab === id;

  return (
    <Link to={link}>
      <button
        className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-2xl transition-all duration-200 ${
          isActive
            ? "text-blue-500 scale-110"
            : "text-gray-600 hover:text-blue-500 hover:backdrop-blur-sm"
        }`}
      >
        <span className={`transition-transform ${isActive ? "scale-110" : ""}`}>
          {icon}
        </span>
        <span className="text-xs font-medium">{name}</span>
      </button>
    </Link>
  );
};

const Navbar = () => {
  const location = useLocation();
  const VALID_TABS = ["", "events", "create", "profile"];
  const [activeTab, setActiveTab] = useState<string>("");

  useEffect(() => {
    const path = location.pathname.split("/");
    const pathString = path.length > 1 ? path[1] : "";
    setActiveTab(pathString || "");
  }, [location]);

  return (
    VALID_TABS.includes(activeTab) && (
      <div
        id="navigation-buttons"
        className="fixed bottom-4 left-4 right-4 h-20 flex items-center justify-around 
                   px-6 bg-white/70 backdrop-blur-md rounded-3xl border border-white/30 shadow-lg z-50"
      >
        <NavButton
          activeTab={activeTab}
          id=""
          name="Map"
          icon={<MapIcon />}
          link="/"
        />
        <NavButton
          activeTab={activeTab}
          id="events"
          name="Feed"
          icon={<EventIcon />}
          link="/events"
        />
        <NavButton
          activeTab={activeTab}
          id="create"
          name="Create"
          icon={<AddCircleIcon sx={{ fontSize: 32 }} />}
          link="/create"
        />
        <NavButton
          activeTab={activeTab}
          id="profile"
          name="Profile"
          icon={<PersonIcon />}
          link="/profile"
        />
      </div>
    )
  );
};

export default Navbar;
