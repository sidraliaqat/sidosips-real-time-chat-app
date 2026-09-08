import { Outlet } from 'react-router-dom';
import { ChatProvider } from '../context/ChatContext';

export default function MainLayout() {
  return (
    <ChatProvider>
      <Outlet />
    </ChatProvider>
  );
}
