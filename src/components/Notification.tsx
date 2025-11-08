
interface NotificationProps {
  children: React.ReactNode;
}

const Notification = ({children}: NotificationProps) => {
  return (
    <div className="absolute top-2 left-2 rounded-lg z-100 bg-white p-4 w-3/4 shadow-lg">
      {children}
      <div className="mt-4">
        <button className="bg-red-300 text-sm rounded-lg p-2 hover:scale-110 transition-all">Dismiss</button>
      </div>
    </div>
  ) 
}

export default Notification;
