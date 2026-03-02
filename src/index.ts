import ChatNav from './ChatNav.vue';
import ChatMain from './ChatMain.vue';
import ChatContext from './ChatContext.vue';
import { useBootaiStore } from './store';

export default {
  id: 'bootai-chat',
  name: 'BootAI Chat',
  icon: 'smart_toy',
  version: '1.0.0',
  navigationComponent: ChatNav,
  mainComponent: ChatMain,
  contextComponent: ChatContext,
  order: 50,
  onRegister() {
    const store = useBootaiStore();
    store.loadFromStorage();
  },
};
