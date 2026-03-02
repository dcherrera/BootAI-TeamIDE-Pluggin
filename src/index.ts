import ChatNav from './ChatNav.vue';
import ChatMain from './ChatMain.vue';
import ChatContext from './ChatContext.vue';
import { useBootaiStore } from './store';

export default {
  id: 'bootai-chat',
  name: 'BootAI Chat',
  icon: 'smart_toy',
  components: {
    ChatNav,
    ChatMain,
    ChatContext,
  },
  setup() {
    const store = useBootaiStore();
    store.loadFromStorage();
  },
};
