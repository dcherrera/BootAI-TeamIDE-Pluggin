<template>
  <div class="chat-nav">
    <q-select
      v-model="store.activeEndpointId"
      :options="endpointOptions"
      option-value="value"
      option-label="label"
      emit-value
      map-options
      dense
      outlined
      label="Endpoint"
      class="q-mb-sm"
      @update:model-value="store.switchEndpoint($event)"
    />

    <q-btn
      label="New Chat"
      icon="add"
      color="primary"
      dense
      flat
      class="full-width q-mb-sm"
      @click="store.newConversation()"
    />

    <q-separator class="q-mb-sm" />

    <q-list dense>
      <q-item
        v-for="conv in store.endpointConversations"
        :key="conv.id"
        clickable
        :active="conv.id === store.activeConversationId"
        active-class="bg-primary text-white"
        @click="store.switchConversation(conv.id)"
      >
        <q-item-section>
          <q-item-label lines="1">{{ conv.title }}</q-item-label>
          <q-item-label caption lines="1">
            {{ conv.messages.length }} messages
          </q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-btn
            icon="delete"
            flat
            dense
            round
            size="sm"
            @click.stop="store.deleteConversation(conv.id)"
          />
        </q-item-section>
      </q-item>

      <q-item v-if="!store.endpointConversations.length">
        <q-item-section>
          <q-item-label class="text-grey">No conversations yet</q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useBootaiStore } from './store';

const store = useBootaiStore();

const endpointOptions = computed(() =>
  store.endpoints.map((ep) => ({ label: ep.name, value: ep.id }))
);
</script>

<style scoped>
.chat-nav {
  padding: 8px;
  height: 100%;
  overflow-y: auto;
}
</style>
